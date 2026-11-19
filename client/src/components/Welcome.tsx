import { languageOf } from '../lib/text';

const SUGGESTIONS = [
  'My 4-year-old has a meltdown every night at bedtime.',
  'میرا دو سال کا بیٹا کھانا کھانے سے انکار کرتا ہے۔',
  "My 9-year-old won't put the tablet down after school.",
  'میری بیٹی روز اسکول جانے سے پہلے روتی ہے۔',
];

interface WelcomeProps {
  onPick: (text: string) => void;
}

export function Welcome({ onPick }: WelcomeProps) {
  return (
    <section className="welcome" aria-labelledby="welcome-title">
      <h1 id="welcome-title" className="welcome__title">
        <span className="welcome__line" lang="en">
          What&rsquo;s going on with your child today?
        </span>
        <span className="welcome__line welcome__line--ur" lang="ur" dir="rtl">
          آج آپ کے بچے کے ساتھ کیا ہو رہا ہے؟
        </span>
      </h1>
      <p className="welcome__lede">
        Write in English or Urdu. You&rsquo;ll get a short plan to try this week and a time to check back in.
      </p>

      <ul className="suggestions" aria-label="Example concerns">
        {SUGGESTIONS.map((text) => {
          const lang = languageOf(text);
          return (
            <li key={text}>
              <button
                type="button"
                className="suggestion"
                lang={lang}
                dir={lang === 'ur' ? 'rtl' : 'ltr'}
                onClick={() => onPick(text)}
              >
                {text}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
