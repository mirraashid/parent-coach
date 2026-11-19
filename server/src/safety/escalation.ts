import type { HelplineRegion } from '../config.js';
import type { EscalationReply, Language, RiskCategory } from '../coach/types.js';
import { getHelplines } from './helplines.js';

interface Template {
  title: string;
  message: string;
  actions: string[];
}

/*
 * Vetted, fixed wording. Crisis replies never come from the model: once a
 * risk is detected (by rules or by the model's classification), the server
 * answers with one of these so the safety message is predictable and
 * reviewable.
 */
const TEMPLATES: Record<RiskCategory, Record<Language, Template>> = {
  emergency: {
    en: {
      title: 'This sounds like an emergency',
      message: 'Please get help right now. A coaching plan is not the right support for this.',
      actions: [
        'Call your local emergency number now.',
        "Stay with your child and follow the call handler's instructions.",
        'If someone else is nearby, ask them to help while you call.',
      ],
    },
    ur: {
      title: 'یہ ایمرجنسی لگتی ہے',
      message: 'براہِ کرم ابھی فوراً مدد حاصل کریں۔ اس صورتحال میں مشورے کے بجائے فوری مدد ضروری ہے۔',
      actions: [
        'ابھی ایمرجنسی نمبر پر کال کریں۔',
        'اپنے بچے کے ساتھ رہیں اور کال پر دی گئی ہدایات پر عمل کریں۔',
        'اگر کوئی اور قریب ہے تو کال کے دوران اس سے مدد لیں۔',
      ],
    },
  },
  abuse: {
    en: {
      title: 'A child may not be safe',
      message:
        'Thank you for telling me. What you describe needs help from people who can act to keep the child safe.',
      actions: [
        'If the child is in danger right now, call the police or your local emergency number.',
        'Contact a child protection helpline to report what happened and get advice.',
        'If you can do it safely, keep the child with a trusted adult and away from the person involved.',
        "Listen calmly and tell the child it is not their fault. Don't press for details.",
      ],
    },
    ur: {
      title: 'ہو سکتا ہے بچہ محفوظ نہ ہو',
      message:
        'بتانے کا شکریہ۔ آپ نے جو بیان کیا ہے اس کے لیے ایسے لوگوں کی مدد ضروری ہے جو بچے کو محفوظ رکھنے کے لیے فوری قدم اٹھا سکیں۔',
      actions: [
        'اگر بچہ اس وقت خطرے میں ہے تو پولیس یا ایمرجنسی نمبر پر کال کریں۔',
        'واقعے کی اطلاع دینے اور رہنمائی کے لیے چائلڈ پروٹیکشن ہیلپ لائن سے رابطہ کریں۔',
        'اگر محفوظ طریقے سے ممکن ہو تو بچے کو کسی قابلِ اعتماد بڑے کے پاس اور متعلقہ شخص سے دور رکھیں۔',
        'بچے کی بات تحمل سے سنیں اور اسے بتائیں کہ اس میں اس کا کوئی قصور نہیں۔ تفصیل کے لیے دباؤ نہ ڈالیں۔',
      ],
    },
  },
  self_harm: {
    en: {
      title: 'Someone may be at risk of harming themselves',
      message:
        "I'm glad you reached out. When someone talks about hurting themselves or not wanting to live, they need support from a trained person today.",
      actions: [
        'If there is immediate danger, call your local emergency number now.',
        'Stay with them, and move medicines and sharp objects out of reach.',
        'Call a mental health helpline to talk to someone trained right away.',
        'If you are the one struggling, these numbers are for you too.',
      ],
    },
    ur: {
      title: 'کسی کو خود کو نقصان پہنچانے کا خطرہ ہو سکتا ہے',
      message:
        'آپ نے رابطہ کیا، یہ اچھی بات ہے۔ جب کوئی خود کو نقصان پہنچانے یا زندہ نہ رہنے کی بات کرے تو آج ہی کسی تربیت یافتہ فرد کی مدد ضروری ہے۔',
      actions: [
        'اگر فوری خطرہ ہے تو ابھی ایمرجنسی نمبر پر کال کریں۔',
        'ان کے ساتھ رہیں، اور دوائیں اور تیز دھار چیزیں ان کی پہنچ سے دور کر دیں۔',
        'فوراً کسی ذہنی صحت ہیلپ لائن پر تربیت یافتہ فرد سے بات کریں۔',
        'اگر آپ خود مشکل میں ہیں تو یہ نمبر آپ کے لیے بھی ہیں۔',
      ],
    },
  },
};

export function buildEscalation(
  category: RiskCategory,
  language: Language,
  region: HelplineRegion,
): EscalationReply {
  const template = TEMPLATES[category][language];
  const { helplines, note } = getHelplines(region, category, language);
  return {
    kind: 'escalation',
    language,
    category,
    title: template.title,
    message: template.message,
    actions: template.actions,
    helplines,
    regionNote: note,
  };
}
