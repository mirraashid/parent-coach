import type { AppConfig } from '../config.js';
import { createAnthropicProvider } from './anthropicProvider.js';
import { createMockProvider } from './mockProvider.js';
import { createOpenAIProvider } from './openaiProvider.js';
import type { LlmProvider } from './types.js';

export type { LlmProvider, LlmRequest, LlmTurn } from './types.js';

export function createProvider(config: AppConfig['llm']): LlmProvider {
  switch (config.provider) {
    case 'openai':
      return createOpenAIProvider({
        apiKey: config.openai.apiKey!,
        model: config.openai.model,
        reasoningEffort: config.openai.reasoningEffort,
        timeoutMs: config.timeoutMs,
      });
    case 'anthropic':
      return createAnthropicProvider({
        apiKey: config.anthropic.apiKey!,
        model: config.anthropic.model,
        effort: config.anthropic.effort,
        timeoutMs: config.timeoutMs,
      });
    case 'mock':
      return createMockProvider();
  }
}
