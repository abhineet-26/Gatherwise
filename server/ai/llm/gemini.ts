import { GoogleGenAI } from '@google/genai';
import type { LlmPort, RunToolLoopRequest, RunToolLoopResponse, GenerateStructuredRequest } from './port';
import { AiError, type Result, type ToolCall, type ToolResult } from '../types';
import { getEnv } from '../../config/env';

export class GeminiLlm implements LlmPort {
  private client: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI {
    const env = getEnv();
    if (!env.GEMINI_API_KEY) {
      throw new AiError('AI_UNAVAILABLE', 'GEMINI_API_KEY is not configured');
    }
    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    }
    return this.client;
  }

  async runToolLoop(req: RunToolLoopRequest): Promise<Result<RunToolLoopResponse, AiError>> {
    try {
      const client = this.getClient();
      const env = getEnv();
      const model = env.GEMINI_MODEL;
      const maxCalls = req.maxToolCalls ?? 6;

      const functionDeclarations = req.tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      }));

      const contents: any[] = req.history.map((h) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      }));

      const toolCalls: ToolCall[] = [];
      const toolResults: ToolResult[] = [];
      let callsCount = 0;

      while (callsCount < maxCalls) {
        if (req.signal?.aborted) {
          throw new AiError('AI_TIMEOUT', 'Request aborted or timed out');
        }

        const response = await client.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: req.system,
            temperature: 0.2,
            maxOutputTokens: 2048,
            tools: [{ functionDeclarations }],
          },
        });

        const candidate = response.candidates?.[0];
        if (!candidate || !candidate.content) {
          throw new AiError('AI_INVALID_OUTPUT', 'Empty model response from Gemini');
        }

        // Preserve model parts verbatim in conversation history (AI-DESIGN.md §3)
        contents.push(candidate.content);

        const callParts = candidate.content.parts?.filter((p: any) => p.functionCall) || [];
        if (callParts.length === 0) {
          // Model finished tool loop and provided final text
          const textPart = candidate.content.parts?.find((p: any) => p.text);
          return {
            ok: true,
            value: {
              text: textPart?.text || '',
              toolCalls,
              toolResults,
            },
          };
        }

        // Execute function calls returned by the model
        const functionResponseParts: any[] = [];
        for (const part of callParts) {
          const fnCall = part.functionCall!;
          const toolCall: ToolCall = {
            name: fnCall.name || '',
            arguments: (fnCall.args as Record<string, unknown>) || {},
          };
          toolCalls.push(toolCall);
          callsCount += 1;

          const toolRes = await req.execute(toolCall);
          toolResults.push(toolRes);

          functionResponseParts.push({
            functionResponse: {
              name: fnCall.name,
              response: { result: toolRes.data, display: toolRes.display },
            },
          });
        }

        // Append function response parts back to history
        contents.push({
          role: 'user',
          parts: functionResponseParts,
        });
      }

      // Max calls reached without final text
      return {
        ok: true,
        value: {
          text: 'Reached maximum planning steps. Summary of ground findings is attached.',
          toolCalls,
          toolResults,
        },
      };
    } catch (err: any) {
      return { ok: false, error: this.mapError(err) };
    }
  }

  async generateStructured<T>(req: GenerateStructuredRequest<T>): Promise<Result<T, AiError>> {
    try {
      const client = this.getClient();
      const env = getEnv();
      const model = req.tier === 'fast' ? env.GEMINI_MODEL_FAST : env.GEMINI_MODEL;

      const response = await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: req.prompt }] }],
        config: {
          systemInstruction: req.system,
          responseMimeType: 'application/json',
          temperature: 0.8,
          maxOutputTokens: 2048,
        },
      });

      const text = response.text || '';
      try {
        const parsedJson = JSON.parse(text);
        const validated = req.schema.parse(parsedJson);
        return { ok: true, value: validated };
      } catch (parseError) {
        // One repair attempt (AI-DESIGN.md §3)
        const repairResponse = await client.models.generateContent({
          model,
          contents: [
            { role: 'user', parts: [{ text: req.prompt }] },
            { role: 'model', parts: [{ text }] },
            {
              role: 'user',
              parts: [{ text: `Validation failed: ${String(parseError)}. Return valid JSON matching schema only.` }],
            },
          ],
          config: {
            systemInstruction: req.system,
            responseMimeType: 'application/json',
          },
        });

        const repairedJson = JSON.parse(repairResponse.text || '{}');
        const revalidated = req.schema.parse(repairedJson);
        return { ok: true, value: revalidated };
      }
    } catch (err: any) {
      return { ok: false, error: this.mapError(err) };
    }
  }

  private mapError(err: any): AiError {
    if (err instanceof AiError) return err;
    const msg = String(err?.message || err).toLowerCase();

    if (msg.includes('not found') || msg.includes('404')) {
      return new AiError('AI_UNAVAILABLE', 'Update GEMINI_MODEL: Specified model was not found.');
    }
    if (msg.includes('quota') || msg.includes('429') || msg.includes('resource_exhausted')) {
      return new AiError('AI_QUOTA_EXCEEDED', 'Gemini rate limit or quota exceeded.');
    }
    if (msg.includes('timeout') || msg.includes('aborted')) {
      return new AiError('AI_TIMEOUT', 'Gemini request timed out after 30 seconds.');
    }
    return new AiError('AI_UNAVAILABLE', 'Gemini service is currently unavailable.');
  }
}
