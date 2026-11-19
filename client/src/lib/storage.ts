import type { ChatMessage } from '../types';

const KEY = 'parent-coach.history.v1';

/** Browser storage can be disabled or full; history is a convenience, so fail quietly. */
export function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

export function saveHistory(messages: ChatMessage[]): void {
  try {
    if (messages.length === 0) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(messages));
  } catch {
    // Ignore: the conversation still works for this page view.
  }
}

export function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
