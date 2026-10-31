import { getEnv } from '../config/env';
import { GeminiLlm } from './llm/gemini';
import type { LlmPort } from './llm/port';
import { runFallbackAssistant } from './fallback';
import { buildSystemPrompt, formatUserMessage, sanitizePromptText } from './prompts';
import { TOOL_DECLARATIONS, runTool } from './tools/registry';
import { validateAndDryRunProposals } from './proposalValidator';
import { auditNumbers } from './numberAudit';
import type { AiContext, AiResponse, ToolResult } from './types';
import { getPackForEvent } from 'shared/planning/packs';
import type { IdeaSeed } from 'shared/planning/types';

// In-memory 5-minute response cache (AI-DESIGN.md §8)
interface CachedEntry {
  response: AiResponse;
  expiresAt: number;
}
const responseCache = new Map<string, CachedEntry>();

// Daily request counter
let dailyTracker = {
  date: new Date().toISOString().slice(0, 10),
  count: 0,
};

function getCacheKey(message: string, context: AiContext): string {
  const version = `${context.event.id}:${context.budgetLines.length}:${context.tasks.length}:${context.quotes.length}`;
  return `${message.trim().toLowerCase()}::${version}`;
}

export class AiOrchestrator {
  constructor(private llm: LlmPort = new GeminiLlm()) {}

  async processChat(rawMessage: string, context: AiContext): Promise<AiResponse> {
    const message = sanitizePromptText(rawMessage);
    if (!message) {
      return runFallbackAssistant('help', context);
    }

    // Check size limit: max 500 characters
    if (message.length > 500) {
      return {
        text: 'Your prompt exceeds the maximum length of 500 characters. Please shorten your question.',
        evidence: [],
        proposals: [],
        toolTrace: [],
        source: 'fallback',
      };
    }

    // 1. Check 5-minute cache
    const cacheKey = getCacheKey(message, context);
    const cached = responseCache.get(cacheKey);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return { ...cached.response, toolTrace: [...cached.response.toolTrace, 'Served from 5-minute cache'] };
    }

    // 2. Daily cap check
    const todayStr = context.today || new Date().toISOString().slice(0, 10);
    if (dailyTracker.date !== todayStr) {
      dailyTracker = { date: todayStr, count: 0 };
    }
    const env = getEnv();
    if (dailyTracker.count >= env.DAILY_AI_CAP) {
      console.warn(`[AiOrchestrator] Daily AI cap (${env.DAILY_AI_CAP}) reached, falling back.`);
      return runFallbackAssistant(message, context);
    }

    // 3. If no API key configured and using real Gemini, use fallback assistant immediately
    if (this.llm instanceof GeminiLlm && !env.GEMINI_API_KEY) {
      return runFallbackAssistant(message, context);
    }

    // 4. Run LLM with tool loop
    try {
      dailyTracker.count++;
      const toolResults: ToolResult[] = [];
      const collectedRawProposals: { title?: string; whyThis?: string; commands: any[] }[] = [];

      const systemPrompt = buildSystemPrompt(context);
      const userPrompt = formatUserMessage(message);

      const llmResult = await this.llm.runToolLoop({
        system: systemPrompt,
        history: [{ role: 'user', content: userPrompt }],
        tools: TOOL_DECLARATIONS,
        execute: async (call) => {
          const res = await runTool(call.name, call.arguments, context);
          toolResults.push(res);
          if (call.name.startsWith('propose_') && (res.data as any)?.proposal) {
            collectedRawProposals.push((res.data as any).proposal);
          }
          return res;
        },
      });

      if (!llmResult.ok) {
        console.warn('[AiOrchestrator] LLM failed, using fallback:', llmResult.error.message);
        return runFallbackAssistant(message, context);
      }

      const { text, toolCalls } = llmResult.value;

      // 5. Validate any proposals generated via dry-run and new-money rules
      const validation = validateAndDryRunProposals(collectedRawProposals, context, message);

      // 6. Audit numbers against tool results and prompt
      const unverifiedNumbers = auditNumbers(text, message, toolResults);

      // 7. Evidence chips
      const evidence: string[] = [];
      for (const res of toolResults) {
        if (res.display) {
          for (const val of Object.values(res.display)) {
            if (typeof val === 'string' && !evidence.includes(val)) {
              evidence.push(val);
            }
          }
        }
      }

      const toolTrace = toolCalls.map(c => `Called ${c.name}`);
      if (validation.errors.length > 0) {
        toolTrace.push(`Blocked invalid proposals: ${validation.errors.join('; ')}`);
      }

      const finalResponse: AiResponse = {
        text,
        evidence: evidence.slice(0, 5),
        proposals: validation.proposals,
        toolTrace,
        unverifiedNumbers: unverifiedNumbers.length > 0 ? unverifiedNumbers : undefined,
        source: 'gemini',
      };

      // Store in cache (5 minutes)
      responseCache.set(cacheKey, {
        response: finalResponse,
        expiresAt: now + 5 * 60 * 1000,
      });

      return finalResponse;
    } catch (err: any) {
      console.warn('[AiOrchestrator] Unexpected error during AI execution, reverting to fallback:', err?.message || err);
      return runFallbackAssistant(message, context);
    }
  }

  getCuratedIdeas(context: AiContext, query?: string): IdeaSeed[] {
    const pack = getPackForEvent(context.event.type);
    const allIdeas = pack.ideaLibrary || [];

    if (!query) return allIdeas;
    const q = query.toLowerCase();
    return allIdeas.filter(
      idea =>
        idea.title.toLowerCase().includes(q) ||
        idea.summary.toLowerCase().includes(q) ||
        idea.tags.some(t => t.toLowerCase().includes(q)) ||
        idea.kind.toLowerCase().includes(q)
    );
  }
}

export const defaultOrchestrator = new AiOrchestrator();

export function clearAiResponseCache(): void {
  responseCache.clear();
}
