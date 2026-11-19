import { describe, expect, it } from 'vitest';
import type { ModelReply } from '../src/coach/types.js';
import { checkModelOutput } from '../src/safety/outputGuard.js';

const base: ModelReply = {
  risk: 'none',
  acknowledgement: 'Bedtime battles are exhausting.',
  steps: ['Start the bedtime routine at the same time each night.', 'Dim the lights 30 minutes before bed.'],
  checkIn: { type: 'time', text: 'Come back in 3 days.' },
};

const withStep = (step: string): ModelReply => ({ ...base, steps: [...base.steps, step] });

describe('checkModelOutput', () => {
  it('allows ordinary practical advice', () => {
    expect(checkModelOutput(base)).toEqual({ ok: true });
  });

  it('blocks dosing instructions', () => {
    expect(checkModelOutput(withStep('Give 5 ml of syrup before bed.'))).toEqual({ ok: false, reason: 'dosage' });
    expect(checkModelOutput(withStep('رات کو 2 گولیاں دیں'))).toEqual({ ok: false, reason: 'dosage' });
  });

  it('blocks medication suggestions', () => {
    expect(checkModelOutput(withStep('Try a little melatonin.'))).toEqual({ ok: false, reason: 'medication' });
  });

  it('blocks diagnoses', () => {
    const reply = { ...base, acknowledgement: 'It sounds like your son has ADHD.' };
    expect(checkModelOutput(reply)).toEqual({ ok: false, reason: 'diagnosis' });
  });

  it('does not treat times or ages as doses', () => {
    expect(checkModelOutput(withStep('Give a 10 minute warning before screens go off.'))).toEqual({ ok: true });
  });
});
