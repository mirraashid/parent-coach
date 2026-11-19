import type { Language } from './types.js';

// Arabic script blocks used by Urdu (base, supplement, presentation forms).
const ARABIC_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g;
const LATIN = /[A-Za-z]/g;

/**
 * Detects whether a message is written in Urdu script or Latin script.
 * Roman Urdu (Urdu typed in Latin letters) returns 'en'; the model still
 * mirrors the parent's wording, only fixed UI text and safety templates use
 * this value.
 */
export function detectLanguage(text: string): Language {
  const arabic = text.match(ARABIC_SCRIPT)?.length ?? 0;
  const latin = text.match(LATIN)?.length ?? 0;
  return arabic > 0 && arabic >= latin ? 'ur' : 'en';
}
