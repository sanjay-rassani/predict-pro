import http from 'http';
import { createApp } from './app.js';
import { initSocket } from './socket/index.js';
import { startLivePoller, stopLivePoller } from './live/poller.js';

export function createServer() {
  const app = createApp();
  const httpServer = http.createServer(app);
  initSocket(httpServer);
  return httpServer;
}

export function startLiveServices() {
  startLivePoller();
}

export function stopLiveServices() {
  stopLivePoller();
}
