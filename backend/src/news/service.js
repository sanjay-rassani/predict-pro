import pool from '../db/pool.js';
import { badRequest, notFound } from '../utils/errors.js';

const CATEGORIES = ['injury', 'transfer', 'lineup', 'general'];

export async function createArticle(body) {
  const { title, body: articleBody, image_url, category, published } = body;
  if (!title || !articleBody) {
    throw badRequest('title and body are required');
  }
  if (category && !CATEGORIES.includes(category)) {
    throw badRequest(`category must be one of: ${CATEGORIES.join(', ')}`);
  }

  const { rows } = await pool.query(
    `INSERT INTO news_articles (title, body, image_url, category, published)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [title, articleBody, image_url ?? null, category ?? 'general', published ?? false],
  );
  return rows[0];
}

export async function listArticles({ published, category, adminView = false } = {}) {
  const conditions = [];
  const params = [];

  if (!adminView) {
    conditions.push('published = TRUE');
  } else if (published !== undefined) {
    params.push(published === 'true' || published === true);
    conditions.push(`published = $${params.length}`);
  }

  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT * FROM news_articles ${where} ORDER BY created_at DESC`,
    params,
  );
  return rows;
}

export async function getArticleById(id) {
  const { rows } = await pool.query('SELECT * FROM news_articles WHERE id = $1', [id]);
  if (rows.length === 0) throw notFound('Article not found');
  return rows[0];
}

export async function updateArticle(id, body) {
  const fields = ['title', 'body', 'image_url', 'category', 'published'];
  const updates = [];
  const params = [id];

  for (const field of fields) {
    if (body[field] !== undefined) {
      if (field === 'category' && !CATEGORIES.includes(body[field])) {
        throw badRequest(`category must be one of: ${CATEGORIES.join(', ')}`);
      }
      params.push(field === 'body' ? body.body : body[field]);
      const col = field === 'body' ? 'body' : field;
      updates.push(`${col} = $${params.length}`);
    }
  }

  if (updates.length === 0) throw badRequest('No fields to update');

  updates.push('updated_at = NOW()');
  const { rows } = await pool.query(
    `UPDATE news_articles SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
    params,
  );
  if (rows.length === 0) throw notFound('Article not found');
  return rows[0];
}

export async function deleteArticle(id) {
  const { rowCount } = await pool.query('DELETE FROM news_articles WHERE id = $1', [id]);
  if (rowCount === 0) throw notFound('Article not found');
}

export { CATEGORIES };
