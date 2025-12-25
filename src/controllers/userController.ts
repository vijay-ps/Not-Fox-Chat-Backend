import { Request, Response } from 'express';

const getSupabase = (req: Request) => {
    if (!req.supabase) {
        throw new Error('Supabase client not found on request');
    }
    return req.supabase;
};

export const searchUsers = async (req: Request, res: Response) => {
    try {
        const { query } = req.query;
        if (!query || typeof query !== 'string') {
            res.status(400).json({ error: 'Search query is required' });
            return;
        }


        const searchTerm = `%${query}%`;
        const supabase = getSupabase(req);

        const { data: users, error } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, status')
            .or(`username.ilike.${searchTerm},display_name.ilike.${searchTerm}`)
            .limit(10);

        if (error) throw error;

        res.json(users);
    } catch (error: any) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: error.message });
    }
};
