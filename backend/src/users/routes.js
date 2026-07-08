import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as userService from './service.js';

const router = Router();

router.use(requireAdmin);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const users = await userService.listUsers(req.query);
    res.json({ data: users });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body ?? {});
    res.status(201).json({ data: user });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await userService.updateUser(Number(req.params.id), req.body ?? {});
    res.json({ data: user });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await userService.deleteUser(Number(req.params.id));
    res.status(204).send();
  }),
);

export default router;
