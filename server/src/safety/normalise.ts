/**
 * Normalises free text so keyword rules match reliably across keyboards and
 * input methods, in English, Urdu script and Roman Urdu.
 */
export function normaliseText(input: string): string {
  return (
    input
      // Folds Arabic presentation forms and full-width characters to base letters.
      .normalize('NFKC')
      .toLowerCase()
      // Curly apostrophes and backticks -> straight, so "can\u2019t" matches "can't".
      .replace(/[\u2018\u2019\u02BC`]/g, "'")
      // Arabic diacritics (harakat, superscript alef) and tatweel.
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      // Zero-width characters and direction marks.
      .replace(/[\u200B-\u200F\u2066-\u2069]/g, '')
      // Arabic letter variants -> Urdu letters (common with Arabic keyboards).
      .replace(/[\u064A\u0649]/g, '\u06CC') // Arabic yeh / alef maksura -> Farsi yeh
      .replace(/\u0643/g, '\u06A9') // Arabic kaf -> keheh
      .replace(/\u0647/g, '\u06C1') // Arabic heh -> heh goal
      // Eastern Arabic / Urdu digits -> ASCII digits.
      .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
      .replace(/\s+/g, ' ')
      .trim()
  );
}
