import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as newsService from './service.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const articles = await newsService.listArticles({ ...req.query, adminView: false });
    res.json({ data: articles });
  }),
);

router.get(
  '/admin/all',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const articles = await newsService.listArticles({ ...req.query, adminView: true });
    res.json({ data: articles });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const article = await newsService.getArticleById(Number(req.params.id));
    res.json({ data: article });
  }),
);

router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const article = await newsService.createArticle(req.body);
    res.status(201).json({ data: article });
  }),
);

router.patch(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const article = await newsService.updateArticle(Number(req.params.id), req.body);
    res.json({ data: article });
  }),
);

router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    await newsService.deleteArticle(Number(req.params.id));
    res.status(204).send();
  }),
);

export default router;
