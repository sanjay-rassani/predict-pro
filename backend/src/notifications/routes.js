import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { badRequest } from '../utils/errors.js';
import * as fcmService from '../fcm/service.js';

const router = Router();

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, token, platform } = req.body ?? {};
    if (!email || !token) {
      throw badRequest('email and token are required');
    }
    const result = await fcmService.registerDeviceToken(email, token, platform);
    res.status(201).json({ data: result });
  }),
);

export default router;
