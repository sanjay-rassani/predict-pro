import { io as Client } from 'socket.io-client';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../src/server.js';
import { migrateUp } from '../src/db/migrate.js';
import { seedAll } from '../src/db/seed.js';
import pool from '../src/db/pool.js';
import config from '../src/config/index.js';
import request from 'supertest';
import { runLivePoll } from '../src/live/service.js';

describe('Socket.IO live updates', () => {
  let httpServer;
  let port;
  let adminToken;
  let matchId;

  before(async () => {
    await migrateUp();
    await pool.query(
      'TRUNCATE admin_users, users, predictions, live_scores, matches, news_articles RESTART IDENTITY CASCADE',
    );
    await seedAll();

    httpServer = createServer();
    await new Promise((resolve) => {
      httpServer.listen(0, () => {
        port = httpServer.address().port;
        resolve();
      });
    });

    const loginRes = await request(httpServer)
      .post('/auth/admin/login')
      .send({ email: config.adminEmail, password: config.adminPassword });
    adminToken = loginRes.body.token;

    const matchRes = await request(httpServer)
      .post('/matches/demo')
      .set('Authorization', `Bearer ${adminToken}`);
    matchId = matchRes.body.data.id;
  });

  after(async () => {
    await new Promise((resolve) => httpServer.close(resolve));
    await pool.end();
  });

  function connectClient(role) {
    return Client(`http://127.0.0.1:${port}`, {
      auth: { role },
      transports: ['websocket'],
    });
  }

  it('emits live:score to all connected clients', async () => {
    const client = connectClient('free');

    await new Promise((resolve, reject) => {
      client.on('connect', resolve);
      client.on('connect_error', reject);
    });

    const scorePromise = new Promise((resolve) => {
      client.on('live:score', (payload) => {
        if (payload.matchId === matchId) resolve(payload);
      });
    });

    await runLivePoll();
    const score = await scorePromise;
    assert.equal(score.matchId, matchId);
    assert.ok(typeof score.homeScore === 'number');
    client.close();
  });

  it('premium client receives live:odds; free client does not', async () => {
    const premium = connectClient('premium');
    const free = connectClient('free');

    await Promise.all([
      new Promise((r) => premium.on('connect', r)),
      new Promise((r) => free.on('connect', r)),
    ]);

    premium.emit('join:match', { matchId });
    free.emit('join:match', { matchId });

    await new Promise((r) => setTimeout(r, 100));

    let premiumOdds = null;
    let freeOdds = null;

    premium.on('live:odds', (p) => {
      if (p.matchId === matchId) premiumOdds = p;
    });
    free.on('live:odds', (p) => {
      freeOdds = p;
    });

    await runLivePoll();
    await new Promise((r) => setTimeout(r, 200));

    assert.ok(premiumOdds, 'premium should receive live:odds');
    assert.ok(premiumOdds.liveOdds?.values, 'odds payload should include values');
    assert.equal(freeOdds, null, 'free client should not receive live:odds');

    premium.close();
    free.close();
  });

  it('published prediction stores odds_snapshot for REST consumers', async () => {
    const predRes = await request(httpServer)
      .post('/predictions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        match_id: matchId,
        type: '1X2',
        predicted_value: '1',
        odds: 2.15,
        publish_status: 'published',
      });

    assert.equal(predRes.status, 201);
    assert.equal(Number(predRes.body.data.odds_snapshot), 2.15);

    const listRes = await request(httpServer).get('/predictions?publish_status=published');
    const pred = listRes.body.data.find((p) => p.id === predRes.body.data.id);
    assert.equal(Number(pred.odds_display), 2.15);
  });
});
