import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { badRequest } from '../utils/errors.js';
import * as matchService from './service.js';
import * as apiFootball from './apiFootball.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const matches = await matchService.listMatches(req.query);
    res.json({ data: matches });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const match = await matchService.getMatchById(Number(req.params.id));
    res.json({ data: match });
  }),
);

router.post(
  '/sync',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { date, league } = req.body ?? req.query ?? {};
    const result = await matchService.syncMatches({ date, league });
    res.json({ data: result, apiUsage: apiFootball.getApiUsage() });
  }),
);

router.post(
  '/demo',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const match = await matchService.insertDemoMatch();
    res.status(201).json({ data: match });
  }),
);

router.patch(
  '/:id/publish',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { published } = req.body ?? {};
    if (typeof published !== 'boolean') {
      throw badRequest('published (boolean) is required');
    }
    const match = await matchService.setMatchPublished(Number(req.params.id), published);
    res.json({ data: match });
  }),
);

export default router;
