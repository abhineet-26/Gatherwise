import type { Result, AiError, ChatTurn, ToolDeclaration, ToolCall, ToolResult, Usage } from '../types';
import type { ZodType } from 'zod';

export interface RunToolLoopRequest {
  system: string;
  history: ChatTurn[];
  tools: ToolDeclaration[];
  execute: (call: ToolCall) => Promise<ToolResult>;
  maxToolCalls?: number;
  signal?: AbortSignal;
}

export interface RunToolLoopResponse {
  text: string;
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  usage?: Usage;
}

export interface GenerateStructuredRequest<T> {
  system: string;
  prompt: string;
  schema: ZodType<T>;
  tier: 'quality' | 'fast';
  signal?: AbortSignal;
}

export interface LlmPort {
  runToolLoop(req: RunToolLoopRequest): Promise<Result<RunToolLoopResponse, AiError>>;
  generateStructured<T>(req: GenerateStructuredRequest<T>): Promise<Result<T, AiError>>;
}
