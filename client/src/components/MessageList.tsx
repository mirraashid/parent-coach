import { useEffect, useRef } from 'react';
import type { ChatStatus } from '../hooks/useCoachChat';
import type { ChatMessage } from '../types';
import { EscalationCard } from './EscalationCard';
import { PlanCard } from './PlanCard';
import { UserMessage } from './UserMessage';

interface MessageListProps {
  messages: ChatMessage[];
  status: ChatStatus;
  error: string | null;
  onRetry: () => void;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function MessageList({ messages, status, error, onRetry }: MessageListProps) {
  const threadRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // A new coach reply is scrolled to its top (so a long safety notice is read
  // from its heading); otherwise keep the newest content in view.
  useEffect(() => {
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
    if (status === 'idle' && messages.at(-1)?.role === 'coach') {
      const rendered = threadRef.current?.querySelectorAll('.msg');
      rendered?.[rendered.length - 1]?.scrollIntoView({ behavior, block: 'start' });
    } else {
      endRef.current?.scrollIntoView({ behavior, block: 'end' });
    }
  }, [messages, status]);

  return (
    <div ref={threadRef} className="thread" role="log" aria-live="polite" aria-relevant="additions">
      {messages.map((message) => {
        if (message.role === 'user') return <UserMessage key={message.id} text={message.text} />;
        return message.reply.kind === 'plan' ? (
          <PlanCard key={message.id} reply={message.reply} />
        ) : (
          <EscalationCard key={message.id} reply={message.reply} />
        );
      })}

      {status === 'sending' && (
        <div className="typing" role="status">
          <span className="typing__dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          Coach is writing a plan
        </div>
      )}

      {status === 'error' && error && (
        <div className="notice" role="status">
          <p>{error}</p>
          <button type="button" className="btn btn--outline" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
