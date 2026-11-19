import { z } from 'zod';

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  LLM_PROVIDER: z.preprocess(
    emptyToUndefined,
    z.enum(['openai', 'anthropic', 'mock']).optional(),
  ),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(45_000),
  OPENAI_API_KEY: optionalString,
  OPENAI_MODEL: z.preprocess(emptyToUndefined, z.string().default('gpt-5.4-mini')),
  OPENAI_REASONING_EFFORT: z.preprocess(
    emptyToUndefined,
    z.enum(['none', 'minimal', 'low', 'medium', 'high']).optional(),
  ),
  ANTHROPIC_API_KEY: optionalString,
  ANTHROPIC_MODEL: z.preprocess(emptyToUndefined, z.string().default('claude-haiku-5-5')),
  ANTHROPIC_EFFORT: z.preprocess(
    emptyToUndefined,
    z.enum(['low', 'medium', 'high', 'xhigh', 'max']).optional(),
  ),
  HELPLINE_REGION: z.preprocess(emptyToUndefined, z.enum(['PK', 'AE', 'INTL']).default('PK')),
});

export type ProviderName = 'openai' | 'anthropic' | 'mock';
export type HelplineRegion = 'PK' | 'AE' | 'INTL';

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  helplineRegion: HelplineRegion;
  llm: {
    provider: ProviderName;
    timeoutMs: number;
    openai: { apiKey?: string; model: string; reasoningEffort?: string };
    anthropic: { apiKey?: string; model: string; effort?: 'low' | 'medium' | 'high' | 'xhigh' | 'max' };
  };
}

/** Picks the provider explicitly set, otherwise the first one with a key, otherwise mock. */
function resolveProvider(env: z.infer<typeof EnvSchema>): ProviderName {
  if (env.LLM_PROVIDER) return env.LLM_PROVIDER;
  if (env.OPENAI_API_KEY) return 'openai';
  if (env.ANTHROPIC_API_KEY) return 'anthropic';
  return 'mock';
}

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  const env = parsed.data;
  const provider = resolveProvider(env);

  if (provider === 'openai' && !env.OPENAI_API_KEY) {
    throw new Error('LLM_PROVIDER is "openai" but OPENAI_API_KEY is not set.');
  }
  if (provider === 'anthropic' && !env.ANTHROPIC_API_KEY) {
    throw new Error('LLM_PROVIDER is "anthropic" but ANTHROPIC_API_KEY is not set.');
  }

  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    helplineRegion: env.HELPLINE_REGION,
    llm: {
      provider,
      timeoutMs: env.LLM_TIMEOUT_MS,
      openai: {
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL,
        reasoningEffort: env.OPENAI_REASONING_EFFORT,
      },
      anthropic: { apiKey: env.ANTHROPIC_API_KEY, model: env.ANTHROPIC_MODEL, effort: env.ANTHROPIC_EFFORT },
    },
  };
}
