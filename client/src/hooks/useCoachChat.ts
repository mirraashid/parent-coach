import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, sendToCoach } from '../api/coachApi';
import { createId, loadHistory, saveHistory } from '../lib/storage';
import { replyToText } from '../lib/text';
import type { ApiTurn, ChatMessage } from '../types';

/** How much history is sent with each request (the server accepts up to 20 turns). */
const CONTEXT_TURNS = 12;
const MAX_COACH_CHARS = 2500;

export type ChatStatus = 'idle' | 'sending' | 'error';

function toApiTurns(messages: ChatMessage[]): ApiTurn[] {
  return messages.slice(-CONTEXT_TURNS).map((m) =>
    m.role === 'user'
      ? { role: 'user', content: m.text }
      : { role: 'coach', content: replyToText(m.reply).slice(0, MAX_COACH_CHARS) },
  );
}

export function useCoachChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef<AbortController | null>(null);

  useEffect(() => saveHistory(messages), [messages]);
  useEffect(() => () => inFlight.current?.abort(), []);

  const request = useCallback(async (history: ChatMessage[]) => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    setStatus('sending');
    setError(null);

    try {
      const { reply } = await sendToCoach(toApiTurns(history), controller.signal);
      setMessages((prev) => [...prev, { id: createId(), role: 'coach', reply, createdAt: Date.now() }]);
      setStatus('idle');
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
      setStatus('error');
    }
  }, []);

  const send = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content || status === 'sending') return false;
      const next: ChatMessage[] = [...messages, { id: createId(), role: 'user', text: content, createdAt: Date.now() }];
      setMessages(next);
      void request(next);
      return true;
    },
    [messages, status, request],
  );

  const retry = useCallback(() => void request(messages), [messages, request]);

  const reset = useCallback(() => {
    inFlight.current?.abort();
    setMessages([]);
    setStatus('idle');
    setError(null);
  }, []);

  return { messages, status, error, send, retry, reset };
}
