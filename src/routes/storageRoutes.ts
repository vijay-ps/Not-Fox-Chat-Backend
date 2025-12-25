import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { uploadFile } from '../controllers/storageController';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', requireAuth, upload.single('file'), uploadFile);

export default router;
