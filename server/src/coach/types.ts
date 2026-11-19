import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Shared domain types                                                 */
/* ------------------------------------------------------------------ */

export type Language = 'en' | 'ur';

export const RISK_CATEGORIES = ['emergency', 'abuse', 'self_harm'] as const;
export type RiskCategory = (typeof RISK_CATEGORIES)[number];

/* ------------------------------------------------------------------ */
/* API request                                                         */
/* ------------------------------------------------------------------ */

export const MAX_MESSAGE_CHARS = 1000;
export const MAX_COACH_CHARS = 2500;
export const MAX_TURNS = 20;

const UserTurnSchema = z.object({
  role: z.literal('user'),
  content: z.string().trim().min(1, 'Message is empty.').max(MAX_MESSAGE_CHARS),
});

const CoachTurnSchema = z.object({
  role: z.literal('coach'),
  content: z.string().trim().min(1).max(MAX_COACH_CHARS),
});

export const ChatTurnSchema = z.discriminatedUnion('role', [UserTurnSchema, CoachTurnSchema]);
export type ChatTurn = z.infer<typeof ChatTurnSchema>;

export const CoachRequestSchema = z.object({
  messages: z
    .array(ChatTurnSchema)
    .min(1)
    .max(MAX_TURNS)
    .refine((turns) => turns.at(-1)?.role === 'user', {
      message: 'The last message must come from the parent.',
    }),
});
export type CoachRequest = z.infer<typeof CoachRequestSchema>;

/* ------------------------------------------------------------------ */
/* What we ask the model to return                                     */
/* ------------------------------------------------------------------ */

export const ModelReplySchema = z.object({
  risk: z.enum(['none', ...RISK_CATEGORIES]),
  acknowledgement: z.string().trim().min(1).max(600),
  steps: z.array(z.string().trim().min(1).max(400)).min(1).max(6),
  checkIn: z.object({
    type: z.enum(['question', 'time']),
    text: z.string().trim().min(1).max(400),
  }),
});
export type ModelReply = z.infer<typeof ModelReplySchema>;

/**
 * JSON Schema handed to the LLM (OpenAI structured outputs / Anthropic tool
 * input). Hand-written so it stays inside the subset strict mode accepts;
 * a unit test keeps it in sync with ModelReplySchema.
 */
export const MODEL_REPLY_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['risk', 'acknowledgement', 'steps', 'checkIn'],
  properties: {
    risk: {
      type: 'string',
      enum: ['none', ...RISK_CATEGORIES],
      description: 'Safety classification of the parent message. See system prompt.',
    },
    acknowledgement: {
      type: 'string',
      description: 'One or two short sentences showing you understood the concern.',
    },
    steps: {
      type: 'array',
      description: '2 to 4 short, concrete actions for the next few days.',
      items: { type: 'string' },
    },
    checkIn: {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'text'],
      properties: {
        type: { type: 'string', enum: ['question', 'time'] },
        text: { type: 'string', description: 'A follow-up question, or when to come back.' },
      },
    },
  },
} as const;

/* ------------------------------------------------------------------ */
/* API response                                                        */
/* ------------------------------------------------------------------ */

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
  /** E.164-ish value for tel: links. */
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

/** Which layer produced the reply. Useful for logs, evals and the demo. */
export type ReplySource =
  | 'model'
  | 'safety_rules'
  | 'model_risk'
  | 'output_guard'
  | 'model_refusal';

export interface CoachResponse {
  reply: CoachReply;
  meta: { source: ReplySource };
}
