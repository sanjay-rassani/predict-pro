import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { badRequest } from '../utils/errors.js';
import * as authService from './service.js';

const router = Router();

router.post(
  '/admin/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      throw badRequest('email and password are required');
    }

    const result = await authService.loginAdmin(email, password);
    res.json(result);
  }),
);

export default router;
