import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as adminService from '../admin/service.js';

const router = Router();

router.get(
  '/signals',
  asyncHandler(async (req, res) => {
    const period = req.query.period ?? req.query.filter;
    const result = await adminService.listSignalHistory({
      period,
      league: req.query.league,
    });
    res.json({ data: result });
  }),
);

export default router;
