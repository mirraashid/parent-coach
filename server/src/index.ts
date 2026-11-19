import { createApp } from './app.js';
import { createCoachService } from './coach/coachService.js';
import { loadConfig } from './config.js';
import { createProvider } from './llm/index.js';
import { logger } from './logger.js';

const config = loadConfig();
const provider = createProvider(config.llm);
const coach = createCoachService({ provider, helplineRegion: config.helplineRegion });
const app = createApp({ coach, providerInfo: { name: provider.name, model: provider.model } });

const server = app.listen(config.port, () => {
  logger.info('server_started', {
    url: `http://localhost:${config.port}`,
    provider: provider.name,
    model: provider.model,
    helplineRegion: config.helplineRegion,
  });
  if (provider.name === 'mock') {
    logger.warn('mock_mode', { hint: 'Set OPENAI_API_KEY or ANTHROPIC_API_KEY in server/.env for real replies.' });
  }
});

function shutdown(signal: string) {
  logger.info('server_stopping', { signal });
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
