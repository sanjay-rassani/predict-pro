import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import pool from '../db/pool.js';
import { unauthorized } from '../utils/errors.js';

export async function loginAppUser(email) {
  const { rows } = await pool.query('SELECT id, email, role FROM users WHERE email = $1', [email]);
  if (rows.length === 0) {
    throw unauthorized('User not found');
  }
  return { user: rows[0] };
}

export async function loginAdmin(email, password) {
  const { rows } = await pool.query(
    'SELECT id, email, password_hash FROM admin_users WHERE email = $1',
    [email],
  );

  if (rows.length === 0) {
    throw unauthorized('Invalid email or password');
  }

  const admin = rows[0];
  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) {
    throw unauthorized('Invalid email or password');
  }

  const token = jwt.sign({ sub: admin.id, email: admin.email, role: 'admin' }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

  return { token, admin: { id: admin.id, email: admin.email } };
}

export async function assertSingleAdminPolicy() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM admin_users');
  if (rows[0].count > 1) {
    throw new Error('Single-admin policy violated: multiple admin accounts exist');
  }
}
