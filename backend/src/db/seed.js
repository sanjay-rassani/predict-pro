import bcrypt from 'bcryptjs';
import config from '../config/index.js';
import pool from './pool.js';

export async function seedAdmin() {
  const passwordHash = await bcrypt.hash(config.adminPassword, 12);
  const { rows } = await pool.query('SELECT id, email FROM admin_users LIMIT 1');

  if (rows.length > 0) {
    const admin = rows[0];
    if (admin.email === config.adminEmail && config.nodeEnv === 'development') {
      await pool.query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [
        passwordHash,
        admin.id,
      ]);
      console.log('[seed] Synced admin password from ADMIN_PASSWORD (development)');
    } else {
      console.log('[seed] Admin account already exists — skipping');
    }
    return;
  }

  await pool.query('INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)', [
    config.adminEmail,
    passwordHash,
  ]);
  console.log(`[seed] Created admin user: ${config.adminEmail}`);
}

export async function seedDemoUsers() {
  const demoUsers = [
    { email: 'free@predictpro.local', role: 'free' },
    { email: 'premium@predictpro.local', role: 'premium' },
  ];

  for (const user of demoUsers) {
    await pool.query(
      `INSERT INTO users (email, role) VALUES ($1, $2)
       ON CONFLICT (email) DO NOTHING`,
      [user.email, user.role],
    );
  }
  console.log('[seed] Demo app users ready (free + premium)');
}

export async function seedAll() {
  await seedAdmin();
  await seedDemoUsers();
}
