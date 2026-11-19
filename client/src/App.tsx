import { Composer } from './components/Composer';
import { Header } from './components/Header';
import { MessageList } from './components/MessageList';
import { Welcome } from './components/Welcome';
import { useCoachChat } from './hooks/useCoachChat';

export function App() {
  const { messages, status, error, send, retry, reset } = useCoachChat();
  const hasMessages = messages.length > 0;

  return (
    <div className="app">
      <Header canReset={hasMessages} onReset={reset} />

      <main className="main">
        {hasMessages ? (
          <>
            <h1 className="visually-hidden">Conversation with Parent Coach</h1>
            <MessageList messages={messages} status={status} error={error} onRetry={retry} />
          </>
        ) : (
          <Welcome onPick={send} />
        )}
      </main>

      <footer className="dock">
        <div className="dock__inner">
          <Composer onSend={send} busy={status === 'sending'} />
          <p className="disclaimer">
            General parenting guidance, not medical or legal advice. In an emergency, call your local emergency
            number.
          </p>
        </div>
      </footer>
    </div>
  );
}
