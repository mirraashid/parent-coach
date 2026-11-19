import type { CoachReply, Language } from '../types';

const ARABIC_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g;
const LATIN = /[A-Za-z]/g;

/** True when the text is mostly Urdu script; used for font, line height and direction. */
export function isUrdu(text: string): boolean {
  const arabic = text.match(ARABIC_SCRIPT)?.length ?? 0;
  const latin = text.match(LATIN)?.length ?? 0;
  return arabic > 0 && arabic >= latin;
}

export function languageOf(text: string): Language {
  return isUrdu(text) ? 'ur' : 'en';
}

export function directionOf(language: Language): 'rtl' | 'ltr' {
  return language === 'ur' ? 'rtl' : 'ltr';
}

/** Turns a structured reply back into plain text so the model sees its own earlier answers. */
export function replyToText(reply: CoachReply): string {
  if (reply.kind === 'escalation') {
    return `[Safety notice shown: ${reply.category}] ${reply.title}. ${reply.message}`;
  }
  const steps = reply.steps.map((step, i) => `${i + 1}. ${step}`).join('\n');
  return `${reply.acknowledgement}\n${steps}\nCheck-in: ${reply.checkIn.text}`;
}
