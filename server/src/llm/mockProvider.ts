import { detectLanguage } from '../coach/language.js';
import type { ModelReply } from '../coach/types.js';
import type { LlmProvider, LlmRequest } from './types.js';

const SAMPLE: Record<'en' | 'ur', Omit<ModelReply, 'risk'>> = {
  en: {
    acknowledgement:
      '(Sample reply: no API key is set, so the coach is in mock mode.) This sounds tiring, and looking for a plan is a good first step.',
    steps: [
      'Notice what usually happens just before the hard moment, and jot it down for two days.',
      'Keep your response short, calm and the same every time.',
      'Praise your child the moment they do what you asked, even briefly.',
    ],
    checkIn: { type: 'time', text: 'Come back in 3 days and tell me what you noticed.' },
  },
  ur: {
    acknowledgement:
      '(نمونے کا جواب: API key موجود نہیں، اس لیے کوچ ماک موڈ میں ہے۔) یہ تھکا دینے والا لگتا ہے، اور حل ڈھونڈنا اچھا پہلا قدم ہے۔',
    steps: [
      'دو دن تک دیکھیں کہ مشکل لمحے سے پہلے عموماً کیا ہوتا ہے، اور لکھ لیں۔',
      'اپنا ردِعمل مختصر، پُرسکون اور ہر بار ایک جیسا رکھیں۔',
      'جیسے ہی بچہ کہا مانے، فوراً اس کی تعریف کریں۔',
    ],
    checkIn: { type: 'time', text: 'تین دن بعد آ کر بتائیں کہ آپ نے کیا دیکھا۔' },
  },
};

/**
 * Offline provider so the app (and the safety layer) can be demoed and tested
 * without an API key. Always returns risk "none": crisis handling in mock
 * mode therefore relies on the deterministic rules alone.
 */
export function createMockProvider(delayMs = 700): LlmProvider {
  return {
    name: 'mock',
    model: 'mock',
    async completeJson({ turns }: LlmRequest) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      const last = turns.at(-1)?.content ?? '';
      return { risk: 'none', ...SAMPLE[detectLanguage(last)] } satisfies ModelReply;
    },
  };
}
