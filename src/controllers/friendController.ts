import { Request, Response } from 'express';

const getSupabase = (req: Request) => {
    if (!req.supabase) {
        throw new Error('Supabase client not found on request');
    }
    return req.supabase;
};

export const sendFriendRequest = async (req: Request, res: Response) => {
    try {
        const { targetUserId } = req.body;
        const supabase = getSupabase(req);
        const user = req.user;

        const { data: requesterProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!requesterProfile) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (requesterProfile.id === targetUserId) {
            res.status(400).json({ error: "Cannot frame yourself" });
            return;
        }


        const { data: existing } = await supabase
            .from('friendships')
            .select('*')
            .or(`and(user_id1.eq.${requesterProfile.id},user_id2.eq.${targetUserId}),and(user_id1.eq.${targetUserId},user_id2.eq.${requesterProfile.id})`)
            .single();

        if (existing) {
            if (existing.status === 'pending') {
                res.status(400).json({ error: 'Request already pending' });
                return;
            }
            if (existing.status === 'accepted') {
                res.status(400).json({ error: 'Already friends' });
                return;
            }
        }

        const { error } = await supabase
            .from('friendships')
            .insert({
                user_id1: requesterProfile.id,
                user_id2: targetUserId,
                status: 'pending'
            });

        if (error) throw error;

        res.json({ message: 'Friend request sent' });
    } catch (error: any) {
        console.error("Error in sendFriendRequest:", error);
        res.status(500).json({ error: error.message });
    }
};

export const acceptFriendRequest = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.body;
        const supabase = getSupabase(req);
        const user = req.user;

        const { data: requesterProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();


        const { data: request } = await supabase
            .from('friendships')
            .select('*')
            .eq('id', requestId)
            .single();

        if (!request) {
            res.status(404).json({ error: 'Request not found' });
            return;
        }

        if (request.user_id2 !== requesterProfile.id) {
            res.status(403).json({ error: 'Not authorized to accept this request' });
            return;
        }

        const { error } = await supabase
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', requestId);

        if (error) throw error;

        res.json({ message: 'Friend request accepted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getFriends = async (req: Request, res: Response) => {
    try {
        const supabase = getSupabase(req);
        const user = req.user;

        const { data: requesterProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();


        const { data: friends } = await supabase
            .from('friendships')
            .select(`
                id,
                status,
                user_id1,
                user_id2,
                profile1:user_id1 (id, username, display_name, avatar_url, status),
                profile2:user_id2 (id, username, display_name, avatar_url, status)
            `)
            .or(`user_id1.eq.${requesterProfile.id},user_id2.eq.${requesterProfile.id}`)
            .eq('status', 'accepted');


        const formatted = friends?.map((f: any) => {
            const isUser1 = f.user_id1 === requesterProfile.id;
            const friend = isUser1 ? f.profile2 : f.profile1;

            return {
                friendship_id: f.id,
                ...friend
            };
        });

        res.json(formatted || []);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getPendingRequests = async (req: Request, res: Response) => {
    try {
        const supabase = getSupabase(req);
        const user = req.user;

        const { data: requesterProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        const { data: requests } = await supabase
            .from('friendships')
            .select(`
                id,
                status,
                user_id1, 
                sender:user_id1 (id, username, display_name, avatar_url)
            `)
            .eq('user_id2', requesterProfile.id)
            .eq('status', 'pending');

        res.json(requests || []);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
