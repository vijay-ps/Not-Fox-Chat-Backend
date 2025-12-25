import { Router, Request, Response } from 'express';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Backend is healthy' });
});

router.get('/users', (req: Request, res: Response) => {

    res.json([
        { id: 1, name: 'Isagi Yoichi' },
        { id: 2, name: 'Bachira Meguru' }
    ]);
});

export default router;
