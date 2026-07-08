import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '../../migrations');

const MIGRATIONS = [
  { id: '001', up: '001_initial_schema.up.sql', down: '001_initial_schema.down.sql' },
  { id: '002', up: '002_live_odds.up.sql', down: '002_live_odds.down.sql' },
  { id: '003', up: '003_device_tokens.up.sql', down: '003_device_tokens.down.sql' },
  { id: '004', up: '004_user_passwords.up.sql', down: '004_user_passwords.down.sql' },
];

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function isApplied(client, id) {
  const { rows } = await client.query('SELECT 1 FROM schema_migrations WHERE id = $1', [id]);
  return rows.length > 0;
}

async function readSql(filename) {
  return fs.readFile(path.join(migrationsDir, filename), 'utf8');
}

export async function migrateUp() {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    for (const migration of MIGRATIONS) {
      if (await isApplied(client, migration.id)) {
        continue;
      }
      const sql = await readSql(migration.up);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [migration.id]);
        await client.query('COMMIT');
        console.log(`[migrate] Applied ${migration.id}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } finally {
    client.release();
  }
}

export async function migrateDown() {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    for (const migration of [...MIGRATIONS].reverse()) {
      if (!(await isApplied(client, migration.id))) {
        continue;
      }
      const sql = await readSql(migration.down);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('DELETE FROM schema_migrations WHERE id = $1', [migration.id]);
        await client.query('COMMIT');
        console.log(`[migrate] Reverted ${migration.id}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } finally {
    client.release();
  }
}
