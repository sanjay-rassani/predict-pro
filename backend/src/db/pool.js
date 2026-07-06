import pg from 'pg';
import config from '../config/index.js';

const pool = new pg.Pool({
  connectionString: config.databaseUrl,
});

pool.on('error', (err) => {
  console.error('[db] Unexpected pool error', err);
});

export default pool;

export async function query(text, params) {
  return pool.query(text, params);
}
