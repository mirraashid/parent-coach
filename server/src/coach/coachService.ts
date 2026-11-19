import type { HelplineRegion } from '../config.js';
import { AppError, InvalidModelOutputError, ModelRefusalError } from '../errors.js';
import type { LlmProvider, LlmTurn } from '../llm/index.js';
import { logger } from '../logger.js';
import { detectCrisis } from '../safety/crisisDetector.js';
import { buildEscalation } from '../safety/escalation.js';
import { checkModelOutput } from '../safety/outputGuard.js';
import { buildReferralPlan } from './fallbacks.js';
import { detectLanguage } from './language.js';
import { PROMPT_VERSION, SYSTEM_PROMPT } from './prompt.js';
import {
  MODEL_REPLY_JSON_SCHEMA,
  ModelReplySchema,
  type ChatTurn,
  type CoachResponse,
  type ModelReply,
} from './types.js';

const MAX_STEPS = 4;

export interface CoachServiceDeps {
  provider: LlmProvider;
  helplineRegion: HelplineRegion;
}

export interface CoachService {
  reply(turns: ChatTurn[]): Promise<CoachResponse>;
}

/**
 * Converts the client's history into the alternating user/assistant shape
 * LLM APIs expect: drops leading coach turns and merges consecutive turns
 * from the same speaker (e.g. a parent who sent twice after an error).
 */
export function toLlmTurns(turns: ChatTurn[]): LlmTurn[] {
  const result: LlmTurn[] = [];
  for (const turn of turns) {
    const role = turn.role === 'user' ? 'user' : 'assistant';
    if (result.length === 0 && role === 'assistant') continue;
    const previous = result.at(-1);
    if (previous && previous.role === role) previous.content += `\n\n${turn.content}`;
    else result.push({ role, content: turn.content });
  }
  return result;
}

export function createCoachService({ provider, helplineRegion }: CoachServiceDeps): CoachService {
  async function askModel(turns: LlmTurn[]): Promise<ModelReply> {
    const request = { system: SYSTEM_PROMPT, turns, schema: MODEL_REPLY_JSON_SCHEMA };
    let lastError: unknown;

    // One retry covers the occasional malformed structured output.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const raw = await provider.completeJson(request);
        const parsed = ModelReplySchema.safeParse(raw);
        if (parsed.success) return parsed.data;
        lastError = new InvalidModelOutputError('Reply did not match schema.', { cause: parsed.error });
      } catch (error) {
        if (!(error instanceof InvalidModelOutputError)) throw error;
        lastError = error;
      }
      logger.warn('model_output_invalid', { attempt, provider: provider.name });
    }
    throw lastError;
  }

  return {
    async reply(turns) {
      const latest = turns.at(-1);
      if (!latest || latest.role !== 'user') {
        throw new AppError(400, 'invalid_request', 'The last message must come from the parent.');
      }
      const language = detectLanguage(latest.content);
      const logBase = { provider: provider.name, model: provider.model, promptVersion: PROMPT_VERSION, language };

      // Layer 1: deterministic crisis rules. Runs before (and instead of) the model.
      const crisis = detectCrisis(latest.content);
      if (crisis) {
        logger.info('coach_escalated', { ...logBase, source: 'safety_rules', ...crisis });
        return {
          reply: buildEscalation(crisis.category, language, helplineRegion),
          meta: { source: 'safety_rules' },
        };
      }

      // Layer 2: the model replies and classifies risk in the same call.
      let modelReply: ModelReply;
      try {
        modelReply = await askModel(toLlmTurns(turns));
      } catch (error) {
        if (error instanceof ModelRefusalError) {
          logger.warn('model_refused', logBase);
          return { reply: buildReferralPlan(language), meta: { source: 'model_refusal' } };
        }
        if (error instanceof InvalidModelOutputError) {
          logger.error('model_output_invalid_final', { ...logBase, error: error.message });
          throw new AppError(502, 'invalid_model_output', 'The coach could not form a reply. Please try again.', {
            cause: error,
          });
        }
        logger.error('model_call_failed', { ...logBase, error: (error as Error).message });
        throw new AppError(502, 'upstream_error', 'The coach is unavailable right now. Please try again.', {
          cause: error,
        });
      }

      if (modelReply.risk !== 'none') {
        logger.info('coach_escalated', { ...logBase, source: 'model_risk', category: modelReply.risk });
        return {
          reply: buildEscalation(modelReply.risk, language, helplineRegion),
          meta: { source: 'model_risk' },
        };
      }

      // Layer 3: block medical dosing, medication names and diagnoses that slipped through.
      const guard = checkModelOutput(modelReply);
      if (!guard.ok) {
        logger.warn('output_guard_blocked', { ...logBase, reason: guard.reason });
        return { reply: buildReferralPlan(language), meta: { source: 'output_guard' } };
      }

      logger.info('coach_replied', { ...logBase, source: 'model' });
      return {
        reply: {
          kind: 'plan',
          language,
          acknowledgement: modelReply.acknowledgement,
          steps: modelReply.steps.slice(0, MAX_STEPS),
          checkIn: modelReply.checkIn,
        },
        meta: { source: 'model' },
      };
    },
  };
}
