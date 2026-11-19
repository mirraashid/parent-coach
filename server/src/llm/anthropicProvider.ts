import Anthropic from '@anthropic-ai/sdk';
import { InvalidModelOutputError, ModelRefusalError } from '../errors.js';
import type { LlmProvider, LlmRequest } from './types.js';

export type AnthropicEffort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

interface AnthropicProviderOptions {
  apiKey: string;
  model: string;
  timeoutMs: number;
  effort?: AnthropicEffort;
}

// Thinking tokens count towards max_tokens, so leave headroom above the short reply.
const MAX_TOKENS = 4096;

/**
 * Uses structured outputs (output_config.format) to get schema-shaped JSON.
 * This works on models where thinking is always on (e.g. Opus 5.5), unlike a
 * forced tool_choice.
 */
export function createAnthropicProvider(options: AnthropicProviderOptions): LlmProvider {
  const client = new Anthropic({ apiKey: options.apiKey, timeout: options.timeoutMs, maxRetries: 1 });

  return {
    name: 'anthropic',
    model: options.model,
    async completeJson({ system, turns, schema }: LlmRequest) {
      const response = await client.messages.create({
        model: options.model,
        max_tokens: MAX_TOKENS,
        system,
        messages: turns,
        output_config: {
          format: { type: 'json_schema', schema },
          ...(options.effort ? { effort: options.effort } : {}),
        },
      });

      if (response.stop_reason === 'refusal') throw new ModelRefusalError();
      if (response.stop_reason === 'max_tokens') {
        throw new InvalidModelOutputError('Reply was cut off at max_tokens.');
      }

      // Thinking blocks may come first; the JSON is in the text block(s).
      const text = response.content
        .flatMap((block) => (block.type === 'text' ? [block.text] : []))
        .join('')
        .trim();
      if (!text) throw new InvalidModelOutputError('Model returned no text.');

      try {
        return JSON.parse(text) as unknown;
      } catch (error) {
        throw new InvalidModelOutputError('Reply was not valid JSON.', { cause: error });
      }
    },
  };
}
