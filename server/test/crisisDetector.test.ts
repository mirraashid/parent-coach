import { describe, expect, it } from 'vitest';
import { detectCrisis } from '../src/safety/crisisDetector.js';
import { normaliseText } from '../src/safety/normalise.js';

describe('detectCrisis', () => {
  describe('escalates clear crises', () => {
    it.each([
      // Emergency, English
      ['My baby is not breathing properly', 'emergency'],
      ['he swallowed a button battery 10 minutes ago', 'emergency'],
      ['My son is unconscious on the floor', 'emergency'],
      ['she is having a seizure', 'emergency'],
      ['My daughter is missing since this afternoon', 'emergency'],
      ['his lips are blue', 'emergency'],
      // Emergency, Urdu and Roman Urdu
      ['میرا بچہ سانس نہیں لے رہا', 'emergency'],
      ['بیٹی بے ہوش ہو گئی ہے', 'emergency'],
      ['اس نے بیٹری نگل لی ہے', 'emergency'],
      ['mera beta behosh ho gaya hai', 'emergency'],
      // Self-harm
      ['My 14 year old said she wants to kill herself', 'self_harm'],
      ['my son talks about suicide', 'self_harm'],
      ['He told me he wants to die', 'self_harm'],
      ['I found cuts, I think she is cutting herself', 'self_harm'],
      ['I feel like I want to end my life', 'self_harm'],
      ['میرا بیٹا خودکشی کی باتیں کرتا ہے', 'self_harm'],
      ['بیٹی کہتی ہے وہ مرنا چاہتی ہے', 'self_harm'],
      ['woh kehta hai marna chahta hun', 'self_harm'],
      // Abuse
      ['I think my daughter was sexually abused by a relative', 'abuse'],
      ['my brother-in-law touched her inappropriately', 'abuse'],
      ['my husband beats our son every night', 'abuse'],
      ['ماموں نے اسے غلط جگہ چھوا', 'abuse'],
      ['بچی کے ساتھ جنسی زیادتی ہوئی', 'abuse'],
    ] as const)('%s -> %s', (text, category) => {
      expect(detectCrisis(text)?.category).toBe(category);
    });
  });

  describe('does not escalate everyday concerns', () => {
    it.each([
      'My 4 year old has a meltdown every night at bedtime',
      'My son hit his sister today and I shouted at him',
      'my son is abusing at school and uses abusive language',
      'My daughter is missing school because of stomach aches',
      'He would not wake up for school again',
      'My toddler refuses to eat vegetables',
      'میرا دو سال کا بیٹا کھانا نہیں کھاتا',
      'مجھے یہ کارٹون زہر لگتا ہے',
      'شام کو سورج ڈوب گیا تو وہ رونے لگا',
      'beta school jane se pehle rota hai',
    ])('%s', (text) => {
      expect(detectCrisis(text)).toBeNull();
    });
  });

  it('prioritises emergency over other categories', () => {
    const match = detectCrisis('He wants to kill himself and swallowed pills');
    expect(match?.category).toBe('emergency');
  });

  it('handles curly apostrophes and Arabic letter variants', () => {
    expect(detectCrisis('She can\u2019t breathe')?.category).toBe('emergency');
    // Arabic yeh/kaf/heh variants typed on an Arabic keyboard.
    expect(detectCrisis('خودكشي')?.category).toBe('self_harm');
  });
});

describe('normaliseText', () => {
  it('lowercases, folds whitespace and converts Urdu digits', () => {
    expect(normaliseText('  Hello   WORLD ۱۲ ')).toBe('hello world 12');
  });

  it('strips Arabic diacritics and zero-width joiners', () => {
    expect(normaliseText('بے\u200Cہوش')).toBe('بےہوش');
    expect(normaliseText('خُودکُشی')).toBe('خودکشی');
  });
});
