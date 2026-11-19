export interface LlmTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface LlmRequest {
  system: string;
  turns: LlmTurn[];
  /** JSON Schema the reply must follow. */
  schema: Record<string, unknown>;
}

/**
 * Minimal provider contract: send a conversation, get back a parsed JSON
 * object (unvalidated). Validation happens once, in the coach service, so
 * every provider is held to the same schema.
 */
export interface LlmProvider {
  readonly name: string;
  readonly model: string;
  completeJson(request: LlmRequest): Promise<unknown>;
}
