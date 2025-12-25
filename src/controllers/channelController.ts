import { Request, Response } from 'express';

const getSupabase = (req: Request) => {
    if (!req.supabase) {
        throw new Error('Supabase client not found on request');
    }
    return req.supabase;
};

export const createChannel = async (req: Request, res: Response) => {
    const { serverId, name, type } = req.body;
    const supabase = getSupabase(req);


    const { data: channels } = await supabase
        .from('channels')
        .select('position')
        .eq('server_id', serverId)
        .order('position', { ascending: false })
        .limit(1);

    const position = (channels?.[0]?.position ?? -1) + 1;

    const { data, error } = await supabase
        .from('channels')
        .insert({
            server_id: serverId,
            name,
            type: type || 'text',
            position,
            is_private: req.body.isPrivate || false,
            allowed_roles: req.body.allowedRoles || [],
        })
        .select()
        .single();

    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }

    res.json(data);
};

export const deleteChannel = async (req: Request, res: Response) => {
    const { channelId } = req.params;
    const supabase = getSupabase(req);

    const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId);

    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }

    res.json({ message: 'Channel deleted' });
};
