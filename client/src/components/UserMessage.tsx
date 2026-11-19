import { languageOf } from '../lib/text';

export function UserMessage({ text }: { text: string }) {
  const lang = languageOf(text);
  return (
    <div className="msg msg--user">
      <p className="bubble" lang={lang} dir="auto">
        <span className="visually-hidden">You said: </span>
        {text}
      </p>
    </div>
  );
}
