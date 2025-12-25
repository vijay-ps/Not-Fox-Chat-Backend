import { Router } from 'express';
import * as channelController from '../controllers/channelController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, channelController.createChannel);
router.delete('/:channelId', requireAuth, channelController.deleteChannel);

export default router;
