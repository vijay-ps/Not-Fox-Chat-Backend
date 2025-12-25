import { Router } from 'express';
import * as messageController from '../controllers/messageController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/:channelId', requireAuth, messageController.getMessages);
router.post('/', requireAuth, messageController.sendMessage);
router.delete('/:messageId', requireAuth, messageController.deleteMessage);

export default router;
