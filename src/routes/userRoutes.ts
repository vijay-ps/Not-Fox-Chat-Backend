import { Router } from 'express';
import * as userController from '../controllers/userController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/search', requireAuth, userController.searchUsers);

export default router;
