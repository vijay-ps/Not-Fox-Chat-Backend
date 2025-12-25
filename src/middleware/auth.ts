import { Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '../config/supabase';


declare global {
    namespace Express {
        interface Request {
            user?: any;
            supabase?: any;
        }
    }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ error: 'No authorization header provided' });
        return;
    }

    const token = authHeader.split(' ')[1];
    const supabase = getSupabaseClient(token);

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
    }

    req.user = user;
    req.supabase = supabase;
    next();
};
