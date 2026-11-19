import OpenAI from 'openai';
import type { ReasoningEffort } from 'openai/resources/shared';
import { InvalidModelOutputError, ModelRefusalError } from '../errors.js';
import type { LlmProvider, LlmRequest } from './types.js';

interface OpenAIProviderOptions {
  apiKey: string;
  model: string;
  timeoutMs: number;
  reasoningEffort?: string;
}

export function createOpenAIProvider(options: OpenAIProviderOptions): LlmProvider {
  const client = new OpenAI({ apiKey: options.apiKey, timeout: options.timeoutMs, maxRetries: 1 });

  return {
    name: 'openai',
    model: options.model,
    async completeJson({ system, turns, schema }: LlmRequest) {
      const completion = await client.chat.completions.create({
        model: options.model,
        messages: [{ role: 'system', content: system }, ...turns],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'coach_reply', strict: true, schema },
        },
        ...(options.reasoningEffort
          ? { reasoning_effort: options.reasoningEffort as ReasoningEffort }
          : {}),
      });

      const message = completion.choices[0]?.message;
      if (message?.refusal) throw new ModelRefusalError(message.refusal);
      if (!message?.content) throw new InvalidModelOutputError('Empty completion.');

      try {
        return JSON.parse(message.content) as unknown;
      } catch (error) {
        throw new InvalidModelOutputError('Completion was not valid JSON.', { cause: error });
      }
    },
  };
}
