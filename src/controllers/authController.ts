import { Request, Response } from 'express';
import { getSupabaseClient } from '../config/supabase';

export const register = async (req: Request, res: Response) => {
    const { email, password, username } = req.body;
    const redirectUrl = req.body.redirectUrl || 'http://localhost:8080/';

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: redirectUrl,
            data: {
                username,
                display_name: username,
            },
        },
    });

    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }

    res.json({ user: data.user, session: data.session });
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        res.status(401).json({ error: error.message });
        return;
    }

    res.json({ user: data.user, session: data.session });
};

export const logout = async (req: Request, res: Response) => {

    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        const supabase = getSupabaseClient(token);
        await supabase.auth.signOut();
    }
    res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req: Request, res: Response) => {

    res.json({ user: req.user });
};
