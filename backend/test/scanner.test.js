import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { migrateUp } from '../src/db/migrate.js';
import { seedAll } from '../src/db/seed.js';
import pool from '../src/db/pool.js';
import config from '../src/config/index.js';
import { shouldFlagSurprise, shouldFlagComeback, scanMatch } from '../src/scanner/service.js';
import { clearPushLog, getPushLog } from '../src/fcm/service.js';
import { updateSettings } from '../src/admin/service.js';

describe('Automated scanner', () => {
  it('Surprise rule: home odds > 4.00', () => {
    assert.equal(shouldFlagSurprise({ values: { Home: 4.5 } }), true);
    assert.equal(shouldFlagSurprise({ values: { Home: 4.0 } }), false);
    assert.equal(shouldFlagSurprise({ values: { Home: 2.1 } }), false);
  });

  it('Comeback rule: home losing by 1 at halftime', () => {
    assert.equal(shouldFlagComeback({ homeScore: 0, awayScore: 1, matchStatus: 'HT' }), true);
    assert.equal(shouldFlagComeback({ homeScore: 1, awayScore: 2, matchStatus: 'HT' }), true);
    assert.equal(shouldFlagComeback({ homeScore: 0, awayScore: 2, matchStatus: 'HT' }), false);
    assert.equal(shouldFlagComeback({ homeScore: 0, awayScore: 1, matchStatus: '1H' }), false);
  });

  it('flags signals as pending automated — never auto-publishes', async () => {
    await migrateUp();
    await pool.query('TRUNCATE predictions, live_scores, matches RESTART IDENTITY CASCADE');

    const { rows: matchRows } = await pool.query(
      `INSERT INTO matches (external_api_id, home_team, away_team, league, match_datetime)
       VALUES (888001, 'Scan Home', 'Scan Away', 'Test League', NOW()) RETURNING *`,
    );
    const match = matchRows[0];
    await pool.query(
      `INSERT INTO live_scores (match_id, home_score, away_score, match_status)
       VALUES ($1, 0, 1, 'HT')`,
      [match.id],
    );

    const surpriseOdds = { values: { Home: 5.0 } };
    const comebackScore = { homeScore: 0, awayScore: 1, matchStatus: 'HT' };

    const surprise = await scanMatch(match, comebackScore, surpriseOdds);
    assert.equal(surprise.length, 2);
    for (const s of surprise) {
      assert.equal(s.approval_status, 'pending');
      assert.equal(s.is_automated_signal, true);
      assert.equal(s.publish_status, 'draft');
    }

    const again = await scanMatch(match, comebackScore, surpriseOdds);
    assert.equal(again.length, 0, 'should not duplicate signals');
  });
});

describe('FCM on signal approval', () => {
  let app;
  let adminToken;
  let matchId;
  let surpriseId;

  before(async () => {
    await migrateUp();
    await pool.query(
      'TRUNCATE admin_users, users, predictions, live_scores, matches, device_tokens, news_articles RESTART IDENTITY CASCADE',
    );
    await seedAll();
    updateSettings({ notificationsEnabled: true });
    clearPushLog();

    app = createApp();
    const loginRes = await request(app).post('/auth/admin/login').send({
      email: config.adminEmail,
      password: config.adminPassword,
    });
    adminToken = loginRes.body.token;

    await request(app)
      .post('/notifications/register')
      .send({
        email: 'premium@predictpro.local',
        token: 'premium-device-token-1',
        platform: 'android',
      });
    await request(app)
      .post('/notifications/register')
      .send({ email: 'free@predictpro.local', token: 'free-device-token-1', platform: 'android' });

    const matchRes = await request(app)
      .post('/matches/demo')
      .set('Authorization', `Bearer ${adminToken}`);
    matchId = matchRes.body.data.id;

    const { rows } = await pool.query(
      `INSERT INTO predictions (
        match_id, type, predicted_value, odds, is_automated_signal,
        approval_status, publish_status
      ) VALUES ($1, 'Surprise', 'Home', 5.0, TRUE, 'pending', 'draft') RETURNING *`,
      [matchId],
    );
    surpriseId = rows[0].id;
  });

  after(async () => {
    clearPushLog();
  });

  it('approve fires mock push to premium devices only', async () => {
    clearPushLog();
    const res = await request(app)
      .post(`/predictions/${surpriseId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.approval_status, 'approved');

    const log = getPushLog();
    assert.ok(log.length > 0);
    const last = log[log.length - 1];
    assert.ok(last.mock || last.sent > 0);
    if (last.mock) {
      assert.ok(last.tokens.includes('premium-device-token-1'));
      assert.ok(!last.tokens.includes('free-device-token-1'));
    }
  });

  it('respects notifications dispatch off toggle', async () => {
    updateSettings({ notificationsEnabled: false });
    clearPushLog();

    const { rows } = await pool.query(
      `INSERT INTO predictions (
        match_id, type, predicted_value, is_automated_signal, approval_status, publish_status
      ) VALUES ($1, 'Comeback', 'Home', TRUE, 'pending', 'draft') RETURNING *`,
      [matchId],
    );

    await request(app)
      .post(`/predictions/${rows[0].id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    const log = getPushLog();
    const skipped = log.find((e) => e.reason === 'notifications_disabled');
    assert.ok(skipped);

    updateSettings({ notificationsEnabled: true });
  });
});
