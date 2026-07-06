import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { badRequest } from '../utils/errors.js';
import * as predictionService from './service.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const includeArchived = req.query.include_archived === 'true';
    const predictions = await predictionService.listPredictions(req.query, { includeArchived });
    res.json({ data: predictions });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const prediction = await predictionService.getPredictionById(Number(req.params.id));
    res.json({ data: prediction });
  }),
);

router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const prediction = await predictionService.createPrediction(req.body);
    res.status(201).json({ data: prediction });
  }),
);

router.patch(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const prediction = await predictionService.updatePrediction(Number(req.params.id), req.body);
    res.json({ data: prediction });
  }),
);

router.post(
  '/:id/publish',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const prediction = await predictionService.publishPrediction(Number(req.params.id));
    res.json({ data: prediction });
  }),
);

router.post(
  '/:id/archive',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const prediction = await predictionService.archivePrediction(Number(req.params.id));
    res.json({ data: prediction });
  }),
);

router.post(
  '/:id/approve',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const prediction = await predictionService.approveSignal(Number(req.params.id));
    res.json({ data: prediction });
  }),
);

router.post(
  '/:id/reject',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const prediction = await predictionService.rejectSignal(Number(req.params.id));
    res.json({ data: prediction });
  }),
);

router.patch(
  '/:id/result',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { result_status } = req.body ?? {};
    if (!result_status) throw badRequest('result_status is required');
    const prediction = await predictionService.updateResultStatus(
      Number(req.params.id),
      result_status,
    );
    res.json({ data: prediction });
  }),
);

export default router;
