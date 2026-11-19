import { directionOf } from '../lib/text';
import type { CheckIn, Language, PlanReply } from '../types';

const LABELS: Record<Language, { plan: string; question: string; time: string }> = {
  en: { plan: "Coach's plan", question: 'A question for you', time: 'Check back' },
  ur: { plan: 'کوچ کا منصوبہ', question: 'آپ سے ایک سوال', time: 'دوبارہ بتائیں' },
};

const URDU_DIGITS = new Intl.NumberFormat('ur-u-nu-arabext');

function CheckInIcon({ type }: { type: CheckIn['type'] }) {
  return type === 'time' ? (
    <svg viewBox="0 0 24 24" className="checkin__icon" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="checkin__icon" aria-hidden="true" focusable="false">
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 12.5v.01M10.2 7.8a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function PlanCard({ reply }: { reply: PlanReply }) {
  const labels = LABELS[reply.language];
  const number = (n: number) => (reply.language === 'ur' ? URDU_DIGITS.format(n) : String(n));

  return (
    <article className="msg msg--coach plan" lang={reply.language} dir={directionOf(reply.language)} aria-label={labels.plan}>
      <p className="plan__ack" dir="auto">
        {reply.acknowledgement}
      </p>
      <ol className="plan__steps">
        {reply.steps.map((step, i) => (
          <li key={i} className="plan__step">
            <span className="plan__num" aria-hidden="true">
              {number(i + 1)}
            </span>
            <span dir="auto">{step}</span>
          </li>
        ))}
      </ol>
      <div className="checkin">
        <CheckInIcon type={reply.checkIn.type} />
        <div>
          <p className="checkin__label">{labels[reply.checkIn.type]}</p>
          <p className="checkin__text" dir="auto">
            {reply.checkIn.text}
          </p>
        </div>
      </div>
    </article>
  );
}
