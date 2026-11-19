import { directionOf } from '../lib/text';
import type { EscalationReply, Language } from '../types';

const LABELS: Record<Language, { call: string }> = {
  en: { call: 'Call' },
  ur: { call: 'کال کریں' },
};

/**
 * Crisis replies are fixed, vetted text from the server. This card is built
 * to be impossible to miss: announced immediately (role="alert") and with
 * tap-to-call numbers.
 */
export function EscalationCard({ reply }: { reply: EscalationReply }) {
  const labels = LABELS[reply.language];

  return (
    <section className="msg msg--coach alert" role="alert" lang={reply.language} dir={directionOf(reply.language)}>
      <div className="alert__head">
        <svg viewBox="0 0 24 24" className="alert__icon" aria-hidden="true" focusable="false">
          <path d="M12 3 2.5 20h19z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M12 10v4.5M12 17.2v.01" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <h2 className="alert__title">{reply.title}</h2>
      </div>
      <p className="alert__message">{reply.message}</p>
      <ul className="alert__actions">
        {reply.actions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>

      {reply.helplines.length > 0 && (
        <div className="alert__calls">
          {reply.helplines.map((line) => (
            <a
              key={line.tel}
              className="call"
              href={`tel:${line.tel}`}
              aria-label={`${labels.call} ${line.number}, ${line.label}`}
            >
              <span className="call__number">
                <svg viewBox="0 0 24 24" className="call__icon" aria-hidden="true" focusable="false">
                  <path
                    d="M6.6 3.5 9 3l1.6 4.2-2 1.4a12 12 0 0 0 6.8 6.8l1.4-2L21 15l-.5 2.4A3 3 0 0 1 17.6 20 15.6 15.6 0 0 1 4 6.4a3 3 0 0 1 2.6-2.9z"
                    fill="currentColor"
                  />
                </svg>
                <bdi dir="ltr">{line.number}</bdi>
              </span>
              <span className="call__label">{line.label}</span>
            </a>
          ))}
        </div>
      )}
      <p className="alert__note">{reply.regionNote}</p>
    </section>
  );
}
