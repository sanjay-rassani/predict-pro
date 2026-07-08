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
    { email: 'free@predictpro.local', role: 'free', password: 'free123' },
    { email: 'premium@predictpro.local', role: 'premium', password: 'premium123' },
  ];

  for (const user of demoUsers) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    await pool.query(
      `INSERT INTO users (email, role, password_hash) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [user.email, user.role, passwordHash],
    );
  }
  console.log('[seed] Demo app users ready (free + premium)');
}

export async function seedDummyUsers() {
  // Shared password for all dummy accounts (dev/demo only).
  const defaultPassword = 'password123';
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  const dummyUsers = [
    { email: 'james.wilson@example.com', role: 'premium' },
    { email: 'olivia.brown@example.com', role: 'free' },
    { email: 'liam.johnson@example.com', role: 'premium' },
    { email: 'emma.davis@example.com', role: 'free' },
    { email: 'noah.martinez@example.com', role: 'premium' },
    { email: 'ava.garcia@example.com', role: 'free' },
    { email: 'william.anderson@example.com', role: 'free' },
    { email: 'sophia.taylor@example.com', role: 'premium' },
    { email: 'benjamin.thomas@example.com', role: 'free' },
    { email: 'mia.hernandez@example.com', role: 'premium' },
    { email: 'lucas.moore@example.com', role: 'free' },
    { email: 'charlotte.jackson@example.com', role: 'free' },
  ];

  for (const user of dummyUsers) {
    await pool.query(
      `INSERT INTO users (email, role, password_hash) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING`,
      [user.email, user.role, passwordHash],
    );
  }
  console.log(`[seed] Dummy app users ready (${dummyUsers.length}, password: ${defaultPassword})`);
}

export async function seedAll() {
  await seedAdmin();
  await seedDemoUsers();
  await seedDummyUsers();
}
