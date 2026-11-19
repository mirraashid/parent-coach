import { describe, expect, it, vi } from 'vitest';
import { createCoachService, toLlmTurns } from '../src/coach/coachService.js';
import { MODEL_REPLY_JSON_SCHEMA, ModelReplySchema, type ChatTurn, type ModelReply } from '../src/coach/types.js';
import { AppError, InvalidModelOutputError, ModelRefusalError } from '../src/errors.js';
import type { LlmProvider } from '../src/llm/index.js';

const plan: ModelReply = {
  risk: 'none',
  acknowledgement: 'Bedtime meltdowns are draining.',
  steps: ['Keep the same routine each night.', 'Give a 5 minute warning.', 'Offer two choices.', 'Praise calm moments.', 'Extra'],
  checkIn: { type: 'question', text: 'How old is your child?' },
};

function fakeProvider(impl: LlmProvider['completeJson']): LlmProvider & { completeJson: ReturnType<typeof vi.fn> } {
  return { name: 'fake', model: 'fake-1', completeJson: vi.fn(impl) };
}

const ask = (content: string): ChatTurn[] => [{ role: 'user', content }];

describe('coachService', () => {
  it('returns a plan from the model, capped at 4 steps', async () => {
    const provider = fakeProvider(async () => plan);
    const coach = createCoachService({ provider, helplineRegion: 'PK' });

    const { reply, meta } = await coach.reply(ask('My 4 year old screams at bedtime'));

    expect(meta.source).toBe('model');
    expect(reply.kind).toBe('plan');
    if (reply.kind !== 'plan') throw new Error('expected plan');
    expect(reply.steps).toHaveLength(4);
    expect(reply.language).toBe('en');
  });

  it('escalates crisis messages without calling the model', async () => {
    const provider = fakeProvider(async () => plan);
    const coach = createCoachService({ provider, helplineRegion: 'PK' });

    const { reply, meta } = await coach.reply(ask('My son swallowed a battery'));

    expect(provider.completeJson).not.toHaveBeenCalled();
    expect(meta.source).toBe('safety_rules');
    expect(reply).toMatchObject({ kind: 'escalation', category: 'emergency', language: 'en' });
    if (reply.kind !== 'escalation') throw new Error('expected escalation');
    expect(reply.helplines.map((h) => h.number)).toContain('1122');
  });

  it('answers Urdu crises in Urdu', async () => {
    const coach = createCoachService({ provider: fakeProvider(async () => plan), helplineRegion: 'PK' });
    const { reply } = await coach.reply(ask('میری بیٹی خودکشی کی بات کر رہی ہے'));
    expect(reply).toMatchObject({ kind: 'escalation', category: 'self_harm', language: 'ur' });
  });

  it('escalates when the model classifies risk the rules missed', async () => {
    const provider = fakeProvider(async () => ({ ...plan, risk: 'abuse' }));
    const coach = createCoachService({ provider, helplineRegion: 'AE' });

    const { reply, meta } = await coach.reply(ask('My husband hits our son when he is angry'));

    expect(meta.source).toBe('model_risk');
    expect(reply).toMatchObject({ kind: 'escalation', category: 'abuse' });
    if (reply.kind !== 'escalation') throw new Error('expected escalation');
    expect(reply.helplines.map((h) => h.number)).toEqual(['116111', '999']);
  });

  it('replaces unsafe medical advice with a referral plan', async () => {
    const provider = fakeProvider(async () => ({ ...plan, steps: ['Give 5 ml of paracetamol.'] }));
    const coach = createCoachService({ provider, helplineRegion: 'PK' });

    const { reply, meta } = await coach.reply(ask('My child has a fever and is cranky'));

    expect(meta.source).toBe('output_guard');
    expect(JSON.stringify(reply)).not.toMatch(/paracetamol|5 ml/i);
  });

  it('retries once on malformed output, then succeeds', async () => {
    const provider = fakeProvider(async () => plan);
    provider.completeJson.mockResolvedValueOnce({ nonsense: true });
    const coach = createCoachService({ provider, helplineRegion: 'PK' });

    const { meta } = await coach.reply(ask('Tantrums in the supermarket'));

    expect(provider.completeJson).toHaveBeenCalledTimes(2);
    expect(meta.source).toBe('model');
  });

  it('fails with a 502 after two malformed outputs', async () => {
    const provider = fakeProvider(async () => {
      throw new InvalidModelOutputError('bad json');
    });
    const coach = createCoachService({ provider, helplineRegion: 'PK' });

    await expect(coach.reply(ask('Screen time fights'))).rejects.toMatchObject({
      status: 502,
      code: 'invalid_model_output',
    });
  });

  it('maps provider outages to a 502 AppError', async () => {
    const provider = fakeProvider(async () => {
      throw new Error('ECONNRESET');
    });
    const coach = createCoachService({ provider, helplineRegion: 'PK' });
    await expect(coach.reply(ask('Picky eating'))).rejects.toBeInstanceOf(AppError);
  });

  it('falls back to a referral plan when the model refuses', async () => {
    const provider = fakeProvider(async () => {
      throw new ModelRefusalError();
    });
    const coach = createCoachService({ provider, helplineRegion: 'PK' });
    const { reply, meta } = await coach.reply(ask('Something sensitive'));
    expect(meta.source).toBe('model_refusal');
    expect(reply.kind).toBe('plan');
  });
});

describe('toLlmTurns', () => {
  it('drops leading coach turns and merges consecutive same-role turns', () => {
    expect(
      toLlmTurns([
        { role: 'coach', content: 'hello' },
        { role: 'user', content: 'a' },
        { role: 'user', content: 'b' },
        { role: 'coach', content: 'c' },
        { role: 'user', content: 'd' },
      ]),
    ).toEqual([
      { role: 'user', content: 'a\n\nb' },
      { role: 'assistant', content: 'c' },
      { role: 'user', content: 'd' },
    ]);
  });
});

describe('MODEL_REPLY_JSON_SCHEMA', () => {
  it('requires exactly the fields the zod schema validates', () => {
    expect([...MODEL_REPLY_JSON_SCHEMA.required].sort()).toEqual(Object.keys(ModelReplySchema.shape).sort());
    expect([...MODEL_REPLY_JSON_SCHEMA.properties.risk.enum]).toEqual(ModelReplySchema.shape.risk.options);
  });
});
