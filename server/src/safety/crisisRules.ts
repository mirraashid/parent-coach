import type { RiskCategory } from '../coach/types.js';

export interface CrisisRule {
  id: string;
  category: RiskCategory;
  pattern: RegExp;
}

/*
 * Deterministic first line of defence. These rules run BEFORE the model and
 * are tuned for high-confidence phrases only: the LLM classifier (second
 * layer) handles nuanced cases such as "my husband hits our son".
 *
 * Deliberate exclusions, to avoid escalating everyday concerns:
 *  - "abusing" / "abusive language" alone: in South Asian English this often
 *    means swearing ("my son is abusing at school").
 *  - "hit", "kick" between children (sibling fights are ordinary behaviour).
 *  - "won't wake up" (usually about school mornings).
 *  - Urdu "زہر لگتا ہے" (idiom: "I can't stand it"), "سورج ڈوب گیا" (sunset).
 *
 * Text is normalised first (see normalise.ts). JavaScript's \b is ASCII-only,
 * so Urdu-script patterns do not use word boundaries.
 */

const CHILD = String.raw`(?:son|daughter|child|kid|kids|children|baby|toddler|boy|girl|teen|teenager)`;
const URDU_CHILD = '(?:بچہ|بچی|بچے|بچوں|بیٹا|بیٹی|بیٹے|بیٹیوں)';

export const CRISIS_RULES: readonly CrisisRule[] = [
  /* ----------------------------- Emergency ----------------------------- */
  {
    id: 'en.breathing',
    category: 'emergency',
    pattern:
      /\b(?:not|isn't|isnt|stopped|can't|cant|cannot|unable to|struggling to|trouble) breath(?:e|ing)\b/,
  },
  {
    id: 'en.unconscious',
    category: 'emergency',
    pattern: /\b(?:unconscious|unresponsive|passed out|collapsed)\b/,
  },
  { id: 'en.seizure', category: 'emergency', pattern: /\b(?:seizures?|seizing|convuls\w*)\b/ },
  { id: 'en.choking', category: 'emergency', pattern: /\bchoking\b/ },
  {
    id: 'en.ingestion',
    category: 'emergency',
    pattern:
      /\b(?:swallowed|ate|drank|ingested)\b.{0,30}\b(?:battery|batteries|button cell|magnets?|bleach|detergent|pods?|poison|pills?|tablets?|medicine|medication|chemicals?|cleaner|kerosene|petrol|acid)\b/,
  },
  { id: 'en.poison', category: 'emergency', pattern: /\bpoison(?:ed|ing)?\b/ },
  { id: 'en.overdose', category: 'emergency', pattern: /\boverdos(?:e|ed|ing)\b/ },
  {
    id: 'en.bleeding',
    category: 'emergency',
    pattern:
      /\b(?:bleeding (?:heavily|a lot|badly|profusely|non ?stop|won't stop|wont stop)|(?:won't|wont|will not) stop bleeding)\b/,
  },
  {
    id: 'en.cyanosis',
    category: 'emergency',
    pattern: /\b(?:(?:turning|turned|gone|going) (?:blue|purple)|lips? (?:are |is |look |looks )?(?:blue|purple))\b/,
  },
  { id: 'en.drowning', category: 'emergency', pattern: /\bdrown(?:ed|ing)?\b/ },
  {
    id: 'en.anaphylaxis',
    category: 'emergency',
    pattern: /\b(?:anaphyla\w*|severe allergic reaction|throat (?:is )?(?:swelling|closing))\b/,
  },
  {
    id: 'en.missing',
    category: 'emergency',
    // "missing" alone is too broad ("my son is missing school"), so the
    // lookahead skips the common everyday objects.
    pattern: new RegExp(
      String.raw`\b(?:${CHILD} (?:is |has gone |went |has been )?missing\b(?! (?:school|class|classes|lessons?|meals?|breakfast|lunch|dinner|his|her|their|out|me|us|you|home|friends|dad|mum|mom|father|mother|papa|mama))|(?:can't|cant|cannot) find (?:my |our )?${CHILD}\b|kidnapp?ed|abducted)`,
    ),
  },
  {
    id: 'en.serious_fall',
    category: 'emergency',
    pattern: /\b(?:fell|fallen) (?:from|off|out of) (?:a |the )?(?:balcony|roof|window|building|terrace)\b/,
  },
  {
    id: 'ur.breathing',
    category: 'emergency',
    pattern: /سانس (?:نہیں|رک|بند)/,
  },
  { id: 'ur.unconscious', category: 'emergency', pattern: /بے ?ہوش/ },
  { id: 'ur.seizure', category: 'emergency', pattern: /(?:دورہ|دورے) (?:پڑ|پڑا|پڑے|پڑ رہے)|جھٹکے لگ/ },
  { id: 'ur.poison', category: 'emergency', pattern: /زہر (?:کھا|پی|نگل)|زہریلی چیز/ },
  {
    id: 'ur.ingestion',
    category: 'emergency',
    pattern: /(?:بیٹری|بیٹریاں|گولی|گولیاں|دوائی|دوائیں|دوا|مقناطیس|بلیچ|تیزاب|مٹی کا تیل).{0,20}(?:نگل|پی ل|کھا ل)/,
  },
  { id: 'ur.bleeding', category: 'emergency', pattern: /خون (?:بہ|نہیں رک|بند نہیں)/ },
  { id: 'ur.drowning', category: 'emergency', pattern: /پانی میں ڈوب/ },
  { id: 'ur.cyanosis', category: 'emergency', pattern: /نیلا پڑ|نیلی پڑ|ہونٹ نیلے/ },
  {
    id: 'ur.missing',
    category: 'emergency',
    pattern: new RegExp(`اغوا|${URDU_CHILD}.{0,15}(?:گم ہو|لاپتہ|نہیں مل رہ)`),
  },
  {
    id: 'roman.emergency',
    category: 'emergency',
    pattern:
      /\b(?:saa?ns nahi?|saa?ns ruk|be ?hosh|zehe?r (?:kha|pi)|khoon (?:beh|nahi ruk)|agh?wa|daura (?:para|pada|par))\b/,
  },

  /* ----------------------------- Self-harm ----------------------------- */
  {
    id: 'en.kill_self',
    category: 'self_harm',
    pattern: /\b(?:kill|kills|killing|harm|harms|harming) (?:him|her|my|them|your|our)sel(?:f|ves)\b/,
  },
  {
    id: 'en.cutting',
    category: 'self_harm',
    pattern: /\b(?:cutting (?:him|her|my|them)sel(?:f|ves)|hurting (?:him|her|my|them)sel(?:f|ves) on purpose)\b/,
  },
  { id: 'en.suicide', category: 'self_harm', pattern: /\bsuicid\w*/ },
  { id: 'en.self_harm', category: 'self_harm', pattern: /\bself[- ]?harm\w*/ },
  {
    id: 'en.end_life',
    category: 'self_harm',
    pattern: /\b(?:end|take) (?:his|her|my|their) (?:own )?life\b/,
  },
  {
    id: 'en.want_die',
    category: 'self_harm',
    pattern:
      /\b(?:(?:wants?|wanted|wanting|wish|wishes|wished) to (?:die|be dead)|(?:doesn't|does not|don't|do not) want to (?:live|be alive)|better off dead|no reason to live)\b/,
  },
  { id: 'ur.suicide', category: 'self_harm', pattern: /خود ?کشی/ },
  { id: 'ur.take_life', category: 'self_harm', pattern: /اپنی جان (?:لے|لینے|لینا|دے|دینے|دینا)/ },
  {
    id: 'ur.want_die',
    category: 'self_harm',
    pattern: /(?:مرنا|مر جانا) چاہت|جینا نہیں چاہت|زندہ نہیں رہنا/,
  },
  {
    id: 'ur.self_injury',
    category: 'self_harm',
    pattern: /(?:خود|اپنے آپ) کو (?:نقصان|زخمی|کاٹ)|کلائی کاٹ/,
  },
  {
    id: 'roman.self_harm',
    category: 'self_harm',
    pattern:
      /\b(?:khud ?kushi|marna chah?t(?:a|i|e)|mar jana chah?t\w*|apni jaan (?:le|lena|de|dena)|khud ko (?:nuqsan|nuksan|zakhmi|kaat)\w*)\b/,
  },

  /* ------------------------------- Abuse ------------------------------- */
  {
    id: 'en.abuse_explicit',
    category: 'abuse',
    pattern:
      /\b(?:(?:sexual(?:ly)?|physical(?:ly)?|emotional(?:ly)?) abus\w*|child abuse|(?:is|was|being|been|got|getting) abused|domestic violence)\b/,
  },
  { id: 'en.molest', category: 'abuse', pattern: /\b(?:molest\w*|rap(?:e|ed|ing)|groom(?:ed|ing) (?:my|our|him|her))\b/ },
  {
    id: 'en.inappropriate_touch',
    category: 'abuse',
    pattern:
      /\b(?:touch(?:ed|es|ing)? (?:him|her|them|my \w+|our \w+) (?:inappropriately|sexually)|inappropriately touch\w*|touch(?:ed|es|ing)? (?:his|her|their) private)/,
  },
  {
    id: 'en.beating',
    category: 'abuse',
    pattern: new RegExp(
      String.raw`\b(?:beats|beating|beaten|punches|punched|burns|burned|chokes|choked|strangl\w*) (?:my|our) ${CHILD}\b|\b(?:beaten|burned|burnt) by (?:his|her|their|my)\b`,
    ),
  },
  { id: 'ur.sexual_abuse', category: 'abuse', pattern: /جنسی (?:زیادتی|تشدد|ہراس)/ },
  {
    id: 'ur.inappropriate_touch',
    category: 'abuse',
    pattern: /غلط (?:طریقے|طرح|جگہ).{0,15}(?:چھو|ہاتھ)/,
  },
  {
    id: 'ur.violence',
    category: 'abuse',
    pattern: new RegExp(`گھریلو تشدد|${URDU_CHILD} (?:پر|کو) تشدد|بری طرح (?:مار|پیٹ)`),
  },
  {
    id: 'roman.abuse',
    category: 'abuse',
    pattern: /\b(?:jinsi|ghar(?:e|ai|i)?lu tashaddud|galat (?:jagah|tareeke|tarah).{0,15}(?:chhu|chu|haath)|buri tarah (?:maar|peet)\w*)/,
  },
];
