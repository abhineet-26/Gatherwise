import type { LlmPort, RunToolLoopRequest, RunToolLoopResponse, GenerateStructuredRequest } from './port';
import { AiError, type Result, type ToolCall, type ToolResult } from '../types';

export class FakeLlm implements LlmPort {
  constructor(
    private readonly mode: 'normal' | 'timeout' | 'quota_exceeded' | 'malformed' | 'malicious_delete' | 'malicious_invent' = 'normal'
  ) {}

  async runToolLoop(req: RunToolLoopRequest): Promise<Result<RunToolLoopResponse, AiError>> {
    if (this.mode === 'timeout') {
      return { ok: false, error: new AiError('AI_TIMEOUT', 'Gemini request timed out after 30s') };
    }
    if (this.mode === 'quota_exceeded') {
      return { ok: false, error: new AiError('AI_QUOTA_EXCEEDED', 'Daily AI token quota exceeded') };
    }
    if (this.mode === 'malformed') {
      return { ok: false, error: new AiError('AI_INVALID_OUTPUT', 'Invalid output from LLM') };
    }

    const lastMessage = req.history[req.history.length - 1]?.content.toLowerCase() || '';
    const toolCalls: ToolCall[] = [];
    const toolResults: ToolResult[] = [];

    // Malicious test injections
    if (this.mode === 'malicious_delete') {
      // Attempts to emit an unauthorized command (e.g. DELETE_EVENT or mass DELETE_TASK)
      const fakeCall: ToolCall = {
        name: 'propose_tasks',
        arguments: { tasks: [{ title: 'Hacked Task', category: 'exploit' }] },
      };
      toolCalls.push(fakeCall);
      const res = await req.execute(fakeCall);
      toolResults.push(res);
      return {
        ok: true,
        value: {
          text: 'I have deleted all your tasks as instructed.',
          toolCalls,
          toolResults,
        },
      };
    }

    if (this.mode === 'malicious_invent') {
      return {
        ok: true,
        value: {
          text: 'You have spent exactly ₹89,45,210 on catering.', // Fabricated figure not from tools
          toolCalls: [],
          toolResults: [],
        },
      };
    }

    // Normal Tool Loop Dispatching based on user query
    if (lastMessage.includes('over budget') || lastMessage.includes('budget status') || lastMessage.includes('how much spent')) {
      const call: ToolCall = { name: 'get_budget_summary', arguments: {} };
      toolCalls.push(call);
      const res = await req.execute(call);
      toolResults.push(res);

      const d = res.data;
      return {
        ok: true,
        value: {
          text: `KNOWN: Your budget status is ${d['status']}. Total target is ${res.display?.['target']}, committed is ${res.display?.['committed']}, and paid is ${res.display?.['paid']}.\n\nESTIMATED: You have ${res.display?.['remaining']} remaining to target.`,
          toolCalls,
          toolResults,
        },
      };
    }

    if (lastMessage.includes('overdue') || lastMessage.includes('pending tasks')) {
      const call: ToolCall = { name: 'list_tasks', arguments: { filter: 'overdue' } };
      toolCalls.push(call);
      const res = await req.execute(call);
      toolResults.push(res);

      const count = res.data['totalMatching'] || 0;
      return {
        ok: true,
        value: {
          text: `KNOWN: You have ${count} overdue task(s) requiring immediate attention.`,
          toolCalls,
          toolResults,
        },
      };
    }

    if (lastMessage.includes('caterer') || lastMessage.includes('quote') || lastMessage.includes('compare')) {
      const call: ToolCall = { name: 'compare_quotes', arguments: { category: 'catering' } };
      toolCalls.push(call);
      const res = await req.execute(call);
      toolResults.push(res);

      return {
        ok: true,
        value: {
          text: `KNOWN: Compared catering quotations at planned headcount. Vendor B is the most cost-effective option at ${res.display?.['cheapest']}.\n\nASSUMPTIONS: Normalised at tax-inclusive payable rates.`,
          toolCalls,
          toolResults,
        },
      };
    }

    if (lastMessage.includes('rain') || lastMessage.includes('contingency')) {
      const call: ToolCall = {
        name: 'propose_tasks',
        arguments: {
          tasks: [
            {
              title: 'Confirm German Hangar Waterproof Tent with Venue',
              category: 'venue',
              priority: 'critical',
              whyThis: 'Rain contingency plan',
            },
            {
              title: 'Source Indoor Backup Generator with 100kVA capacity',
              category: 'venue',
              priority: 'high',
              whyThis: 'Power backup for rain scenario',
            },
          ],
        },
      };
      toolCalls.push(call);
      const res = await req.execute(call);
      toolResults.push(res);

      return {
        ok: true,
        value: {
          text: 'KNOWN: Rain risk identified. I have drafted 2 contingency tasks for your review and approval.',
          toolCalls,
          toolResults,
        },
      };
    }

    if (lastMessage.includes('paid ₹50,000') || lastMessage.includes('50000')) {
      const call: ToolCall = {
        name: 'propose_payment_record',
        arguments: {
          vendorName: 'Annapurna Gourmet Caterers',
          amountPaise: 5000000,
          mode: 'upi',
        },
      };
      toolCalls.push(call);
      const res = await req.execute(call);
      toolResults.push(res);

      return {
        ok: true,
        value: {
          text: 'KNOWN: Drafted payment record of ₹50,000 for your review and confirmation.',
          toolCalls,
          toolResults,
        },
      };
    }

    // Default overview response
    const call: ToolCall = { name: 'get_event_overview', arguments: {} };
    toolCalls.push(call);
    const res = await req.execute(call);
    toolResults.push(res);

    return {
      ok: true,
      value: {
        text: `KNOWN: Event is on track with ${res.display?.['daysLeft']}.\n\nOPEN QUESTIONS: What aspect of your celebration would you like to review?`,
        toolCalls,
        toolResults,
      },
    };
  }

  async generateStructured<T>(_req: GenerateStructuredRequest<T>): Promise<Result<T, AiError>> {
    if (this.mode === 'timeout') {
      return { ok: false, error: new AiError('AI_TIMEOUT', 'Structured generation timed out') };
    }
    // Return mock structured ideas
    const mockIdeas = {
      ideas: [
        {
          id: 'idea_1',
          title: 'Live Chaat & Kulfi Street Food Bazaar',
          category: 'catering',
          budgetTier: 2,
          description: 'A vibrant live-counter street food setup with traditional earthen pots.',
          whyItFits: ['Matches food priority', 'Delights multi-generational guests'],
        },
        {
          id: 'idea_2',
          title: 'Sunset Acoustic Shehnai & Sitar Duo',
          category: 'entertainment',
          budgetTier: 1,
          description: 'Traditional live acoustic instruments welcoming arrivals.',
          whyItFits: ['High aesthetic impact', 'Low cost compared to brass band'],
        },
      ],
    };

    return { ok: true, value: mockIdeas as unknown as T };
  }
}
