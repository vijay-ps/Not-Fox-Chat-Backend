import { Router } from 'express';
import * as serverController from '../controllers/serverController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, serverController.getServers);
router.post('/', requireAuth, serverController.createServer);
router.post('/join', requireAuth, serverController.joinServer);

router.delete('/:serverId/members/:memberId', requireAuth, serverController.kickMember);


router.get('/:serverId/channels', requireAuth, serverController.getChannels);

export default router;
