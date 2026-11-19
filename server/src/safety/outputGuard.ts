import type { ModelReply } from '../coach/types.js';
import { normaliseText } from './normalise.js';

export type GuardResult = { ok: true } | { ok: false; reason: 'dosage' | 'medication' | 'diagnosis' };

/*
 * Last line of defence on the model's output. The prompt already forbids
 * medical instructions and diagnoses; this catches the cases where the model
 * slips anyway. It is intentionally conservative: a false positive costs a
 * slightly more generic (still safe) reply.
 */
const DOSAGE =
  /\b\d+(?:\.\d+)?\s?(?:mg|mcg|ml|milligrams?|millilit(?:er|re)s?|tablets?|capsules?|teaspoons?|tsp|drops)\b|\d+\s?(?:ملی ?گرام|ملی ?لیٹر|گولی|گولیاں|چمچ|قطرے)/;

const MEDICATION =
  /\b(?:paracetamol|acetaminophen|ibuprofen|calpol|panadol|brufen|tylenol|motrin|aspirin|antibiotics?|amoxicillin|melatonin|antihistamines?|benadryl|cough syrup|sleeping pills?)\b|پیناڈول|پیراسیٹامول|اینٹی ?بائیوٹک|بروفین/;

const DIAGNOSIS =
  /\b(?:has|probably has|likely has|might have|may have|could have|suffers from|is suffering from|shows signs of|is showing signs of|sounds like|looks like|diagnos\w*)\b.{0,25}\b(?:adhd|autism|autistic|asd|depression|bipolar|ocd|dyslexia|anxiety disorder|a disorder|an infection|asthma|epilepsy|oppositional defiant)\b/;

export function checkModelOutput(reply: ModelReply): GuardResult {
  const text = normaliseText(
    [reply.acknowledgement, ...reply.steps, reply.checkIn.text].join('\n'),
  );
  if (DOSAGE.test(text)) return { ok: false, reason: 'dosage' };
  if (MEDICATION.test(text)) return { ok: false, reason: 'medication' };
  if (DIAGNOSIS.test(text)) return { ok: false, reason: 'diagnosis' };
  return { ok: true };
}
