/**
 * Vyberology API Server
 * Volume 1 & 2 Reading Engine
 */

import { buildApp } from './app.js';
import { config } from './config.js';

async function start() {
  try {
    const app = await buildApp();

    await app.listen({
      port: config.port,
      host: config.host,
    });

    console.log(`
🔮 Vyberology API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Environment: ${config.env}
  Server:      http://${config.host}:${config.port}
  Health:      http://${config.host}:${config.port}/health
  Docs:        http://${config.host}:${config.port}/docs

  Volume I:    Deterministic Numerology Parser
  Volume II:   Narrative Composition Engine
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
