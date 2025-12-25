import { Router } from 'express';
import * as friendController from '../controllers/friendController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/request', requireAuth, friendController.sendFriendRequest);
router.post('/accept', requireAuth, friendController.acceptFriendRequest);
router.get('/', requireAuth, friendController.getFriends);
router.get('/pending', requireAuth, friendController.getPendingRequests);

export default router;
