import type { RiskCategory } from '../coach/types.js';
import { CRISIS_RULES, type CrisisRule } from './crisisRules.js';
import { normaliseText } from './normalise.js';

export interface CrisisMatch {
  category: RiskCategory;
  ruleId: string;
}

// When several categories match, the most time-critical one wins.
const PRIORITY: readonly RiskCategory[] = ['emergency', 'self_harm', 'abuse'];

export function detectCrisis(
  text: string,
  rules: readonly CrisisRule[] = CRISIS_RULES,
): CrisisMatch | null {
  const normalised = normaliseText(text);
  const matches = rules.filter((rule) => rule.pattern.test(normalised));
  if (matches.length === 0) return null;

  for (const category of PRIORITY) {
    const match = matches.find((rule) => rule.category === category);
    if (match) return { category, ruleId: match.id };
  }
  return null;
}
