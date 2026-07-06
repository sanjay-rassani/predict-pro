import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as adminService from './service.js';

const router = Router();

router.use(requireAdmin);

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const stats = await adminService.getDashboardStats();
    res.json({ data: stats });
  }),
);

router.get(
  '/export/predictions',
  asyncHandler(async (req, res) => {
    const csv = await adminService.exportPredictionsCsv(req.query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="predictions.csv"');
    res.send(csv);
  }),
);

router.get(
  '/export/signal-history',
  asyncHandler(async (req, res) => {
    const csv = await adminService.exportSignalHistoryCsv(req.query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="signal-history.csv"');
    res.send(csv);
  }),
);

router.get(
  '/api-health',
  asyncHandler(async (_req, res) => {
    res.json({ data: adminService.getApiHealth() });
  }),
);

router.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    res.json({ data: adminService.getSettings() });
  }),
);

router.patch(
  '/settings',
  asyncHandler(async (req, res) => {
    const settings = adminService.updateSettings(req.body ?? {});
    res.json({ data: settings });
  }),
);

export default router;
