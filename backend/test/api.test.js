import request from 'supertest';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { migrateUp, migrateDown } from '../src/db/migrate.js';
import { seedAll } from '../src/db/seed.js';
import pool from '../src/db/pool.js';
import config from '../src/config/index.js';

describe('Predict Pro API', () => {
  let app;
  let adminToken;

  before(async () => {
    await migrateUp();
    await pool.query(
      'TRUNCATE admin_users, users, predictions, live_scores, matches, news_articles RESTART IDENTITY CASCADE',
    );
    await seedAll();
    app = createApp();

    const loginRes = await request(app).post('/auth/admin/login').send({
      email: config.adminEmail,
      password: config.adminPassword,
    });
    adminToken = loginRes.body.token;
  });

  after(async () => {
    // pool kept open for other test files (run with --test-concurrency=1)
  });

  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  it('POST /auth/admin/login rejects bad credentials', async () => {
    const res = await request(app).post('/auth/admin/login').send({
      email: config.adminEmail,
      password: 'wrong-password',
    });
    assert.equal(res.status, 401);
  });

  it('admin can create demo match and manual prediction draft', async () => {
    const matchRes = await request(app)
      .post('/matches/demo')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(matchRes.status, 201);
    const matchId = matchRes.body.data.id;

    const predRes = await request(app)
      .post('/predictions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        match_id: matchId,
        type: '1X2',
        predicted_value: '1',
        odds: 2.1,
        confidence_score: 75,
        publish_status: 'draft',
      });
    assert.equal(predRes.status, 201);
    assert.equal(predRes.body.data.publish_status, 'draft');

    const publishRes = await request(app)
      .post(`/predictions/${predRes.body.data.id}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(publishRes.status, 200);
    assert.equal(publishRes.body.data.publish_status, 'published');
  });

  it('GET /predictions returns published predictions for app', async () => {
    const res = await request(app).get('/predictions?publish_status=published');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  it('admin news CRUD and public feed shows published only', async () => {
    const createRes = await request(app)
      .post('/news')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Test injury',
        body: 'Player out',
        category: 'injury',
        published: false,
      });
    assert.equal(createRes.status, 201);

    const publicRes = await request(app).get('/news');
    assert.equal(publicRes.status, 200);
    assert.equal(publicRes.body.data.length, 0);

    await request(app)
      .patch(`/news/${createRes.body.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ published: true });

    const publicAfter = await request(app).get('/news');
    assert.equal(publicAfter.body.data.length, 1);
  });

  it('GET /admin/stats returns dashboard counts', async () => {
    const res = await request(app).get('/admin/stats').set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.ok('todaysMatches' in res.body.data);
    assert.ok('premiumUsers' in res.body.data);
  });

  it('GET /analytics/signals supports period filter', async () => {
    const res = await request(app).get('/analytics/signals?period=today');
    assert.equal(res.status, 200);
    assert.ok(res.body.data.summary);
  });

  it('migrations run down cleanly', async () => {
    await migrateDown();
    const { rows } = await pool.query("SELECT to_regclass('public.matches') AS matches_table");
    assert.equal(rows[0].matches_table, null);
    await migrateUp();
  });
});
