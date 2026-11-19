import type { Language, PlanReply } from './types.js';

/**
 * Safe, generic plan used when the model's reply was blocked by the output
 * guard or the model refused. Points the parent to a professional without
 * naming conditions or treatments.
 */
const REFERRAL: Record<Language, Omit<PlanReply, 'kind' | 'language'>> = {
  en: {
    acknowledgement:
      "This sounds like something your child's doctor or another qualified professional should look at, so I won't suggest treatments or name a condition.",
    steps: [
      'Write down what you have noticed: when it started, how often it happens and what makes it better or worse.',
      "Book a visit with your child's doctor and take those notes with you.",
      'Until then, keep routines calm and predictable, and stay close and reassuring.',
    ],
    checkIn: {
      type: 'question',
      text: 'After you have spoken to the doctor, would you like help with the day-to-day side of things?',
    },
  },
  ur: {
    acknowledgement:
      'یہ ایسی بات لگتی ہے جسے بچے کے ڈاکٹر یا کسی ماہر کو دیکھنا چاہیے، اس لیے میں کوئی علاج یا بیماری کا نام نہیں بتاؤں گا۔',
    steps: [
      'جو کچھ آپ نے دیکھا ہے لکھ لیں: یہ کب شروع ہوا، کتنی بار ہوتا ہے، اور کس چیز سے بہتر یا بدتر ہوتا ہے۔',
      'بچے کے ڈاکٹر سے وقت لیں اور یہ نوٹس ساتھ لے جائیں۔',
      'تب تک روزمرہ کا معمول پُرسکون اور ایک جیسا رکھیں، اور بچے کے قریب رہ کر تسلی دیں۔',
    ],
    checkIn: {
      type: 'question',
      text: 'ڈاکٹر سے بات کرنے کے بعد، کیا آپ روزمرہ معاملات میں مدد چاہیں گے؟',
    },
  },
};

export function buildReferralPlan(language: Language): PlanReply {
  return { kind: 'plan', language, ...REFERRAL[language] };
}
