/*
 * Mirrors the API contract in server/src/coach/types.ts.
 * (Kept as a small copy instead of a shared package to keep the repo simple.)
 */

export type Language = 'en' | 'ur';
export type RiskCategory = 'emergency' | 'abuse' | 'self_harm';

export interface CheckIn {
  type: 'question' | 'time';
  text: string;
}

export interface PlanReply {
  kind: 'plan';
  language: Language;
  acknowledgement: string;
  steps: string[];
  checkIn: CheckIn;
}

export interface Helpline {
  label: string;
  number: string;
  tel: string;
}

export interface EscalationReply {
  kind: 'escalation';
  language: Language;
  category: RiskCategory;
  title: string;
  message: string;
  actions: string[];
  helplines: Helpline[];
  regionNote: string;
}

export type CoachReply = PlanReply | EscalationReply;

export interface CoachResponse {
  reply: CoachReply;
  meta: { source: string };
}

export interface ApiTurn {
  role: 'user' | 'coach';
  content: string;
}

/* UI state */

export type ChatMessage =
  | { id: string; role: 'user'; text: string; createdAt: number }
  | { id: string; role: 'coach'; reply: CoachReply; createdAt: number };
