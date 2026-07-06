import config from './config/index.js';
import { createServer, startLiveServices, stopLiveServices } from './server.js';
import { migrateUp } from './db/migrate.js';
import { seedAll } from './db/seed.js';
import { assertSingleAdminPolicy } from './auth/service.js';

async function start() {
  await migrateUp();
  await seedAll();
  await assertSingleAdminPolicy();

  const httpServer = createServer();
  startLiveServices();

  httpServer.listen(config.port, () => {
    console.log(`[predict-pro-backend] Listening on http://localhost:${config.port}`);
    console.log(`[predict-pro-backend] WebSocket at ws://localhost:${config.port}/socket.io`);
  });

  const shutdown = () => {
    stopLiveServices();
    httpServer.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('[predict-pro-backend] Failed to start', err);
  process.exit(1);
});
