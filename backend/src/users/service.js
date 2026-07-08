import bcrypt from 'bcryptjs';
import pool from '../db/pool.js';
import { badRequest, conflict, notFound } from '../utils/errors.js';

const ROLES = ['free', 'premium'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function assertValidRole(role) {
  if (role !== undefined && !ROLES.includes(role)) {
    throw badRequest(`role must be one of: ${ROLES.join(', ')}`);
  }
}

function assertValidPassword(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw badRequest(`password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
}

export async function listUsers({ role, search } = {}) {
  const conditions = [];
  const params = [];

  if (role) {
    assertValidRole(role);
    params.push(role);
    conditions.push(`role = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`email ILIKE $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT id, email, role, created_at FROM users ${where} ORDER BY created_at DESC`,
    params,
  );
  return rows;
}

export async function createUser({ email, role, password } = {}) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw badRequest('email is required');
  }
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw badRequest('email is invalid');
  }
  assertValidRole(role);
  assertValidPassword(password);

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (email, role, password_hash) VALUES ($1, $2, $3)
       RETURNING id, email, role, created_at`,
      [normalizedEmail, role ?? 'free', passwordHash],
    );
    return rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw conflict('A user with this email already exists');
    }
    throw err;
  }
}

export async function updateUser(id, { email, role, password } = {}) {
  const updates = [];
  const params = [id];

  if (email !== undefined) {
    const normalizedEmail = normalizeEmail(email);
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      throw badRequest('email is invalid');
    }
    params.push(normalizedEmail);
    updates.push(`email = $${params.length}`);
  }
  if (role !== undefined) {
    assertValidRole(role);
    params.push(role);
    updates.push(`role = $${params.length}`);
  }
  if (password !== undefined && password !== '') {
    assertValidPassword(password);
    const passwordHash = await bcrypt.hash(password, 12);
    params.push(passwordHash);
    updates.push(`password_hash = $${params.length}`);
  }

  if (updates.length === 0) {
    throw badRequest('No fields to update');
  }

  try {
    const { rows } = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $1
       RETURNING id, email, role, created_at`,
      params,
    );
    if (rows.length === 0) throw notFound('User not found');
    return rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw conflict('A user with this email already exists');
    }
    throw err;
  }
}

export async function deleteUser(id) {
  const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
  if (rowCount === 0) throw notFound('User not found');
}

export { ROLES };
