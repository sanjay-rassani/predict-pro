import config from '../config/index.js';
import { runLivePoll } from './service.js';

let intervalId = null;
let polling = false;

export function startLivePoller() {
  if (intervalId) return;

  const tick = async () => {
    if (polling) return;
    polling = true;
    try {
      const result = await runLivePoll();
      if (config.nodeEnv === 'development') {
        console.log('[live-poller]', result);
      }
    } catch (err) {
      console.error('[live-poller] Error:', err.message);
    } finally {
      polling = false;
    }
  };

  tick();
  intervalId = setInterval(tick, config.livePollIntervalMs);
  console.log(
    `[live-poller] Started (interval ${config.livePollIntervalMs}ms, demo=${config.liveDemoMode})`,
  );
}

export function stopLivePoller() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
