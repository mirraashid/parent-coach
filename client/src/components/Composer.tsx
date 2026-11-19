import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { languageOf } from '../lib/text';

const MAX_CHARS = 1000;
const MAX_HEIGHT_PX = 200;

interface ComposerProps {
  /** Returns true when the message was accepted. */
  onSend: (text: string) => boolean;
  busy: boolean;
}

export function Composer({ onSend, busy }: ComposerProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const remaining = MAX_CHARS - text.length;

  // Grow with the content, up to a cap.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [text]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (onSend(text)) setText('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter adds a line. Ignore Enter while an IME is composing.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form className="composer" onSubmit={submit}>
      <label htmlFor="concern" className="visually-hidden">
        Describe your concern
      </label>
      <textarea
        id="concern"
        ref={textareaRef}
        className="composer__input"
        lang={languageOf(text)}
        dir="auto"
        rows={1}
        maxLength={MAX_CHARS}
        value={text}
        placeholder="Describe what’s happening"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <div className="composer__side">
        {remaining <= 150 && (
          <span className="composer__count" aria-live="polite">
            {remaining} left
          </span>
        )}
        <button type="submit" className="btn btn--primary" disabled={busy || !text.trim()}>
          Send
        </button>
      </div>
    </form>
  );
}
