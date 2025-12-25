import { Request, Response } from 'express';


const getSupabase = (req: Request) => {
    if (!req.supabase) {
        throw new Error('Supabase client not found on request');
    }
    return req.supabase;
};

export const getServers = async (req: Request, res: Response) => {
    try {
        const supabase = getSupabase(req);
        const user = req.user;

        // Fetch profile to get profile.id
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!profile) {
            res.json([]);
            return;
        }


        const { data: memberData } = await supabase
            .from('server_members')
            .select('server_id')
            .eq('profile_id', profile.id);

        const serverIds = memberData?.map((m: any) => m.server_id) || [];


        const { data: ownedData } = await supabase
            .from('servers')
            .select('id')
            .eq('owner_id', profile.id);

        const ownedIds = ownedData?.map((s: any) => s.id) || [];
        const allServerIds = [...new Set([...serverIds, ...ownedIds])];

        if (allServerIds.length === 0) {
            res.json([]);
            return;
        }

        const { data: servers, error } = await supabase
            .from('servers')
            .select('*')
            .in('id', allServerIds);

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        res.json(servers);
    } catch (error: any) {
        console.error("Error in getServers:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const createServer = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;
        const supabase = getSupabase(req);
        const user = req.user;


        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (profileError || !profile) {
            console.error('Error fetching profile:', profileError);
            res.status(400).json({ error: 'Profile not found' });
            return;
        }


        const { data: server, error } = await supabase
            .from('servers')
            .insert({
                name,
                description,
                owner_id: profile.id,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating server:', error);
            res.status(400).json({ error: error.message });
            return;
        }


        await supabase.from('channels').insert([
            { server_id: server.id, name: 'general', type: 'text', position: 0 },
            { server_id: server.id, name: 'announcements', type: 'announcement', position: 1 },
            { server_id: server.id, name: 'voice-chat', type: 'voice', position: 2 },
        ]);


        await supabase.from('server_members').insert({
            server_id: server.id,
            profile_id: profile.id,
        });


        await supabase.from('server_roles').insert([
            { server_id: server.id, name: 'Admin', color: '#e74c3c', position: 2 },
            { server_id: server.id, name: 'Moderator', color: '#3498db', position: 1 },
            { server_id: server.id, name: 'Member', color: '#99aab5', position: 0, is_default: true },
        ]);

        res.json(server);
    } catch (error: any) {
        console.error("Error in createServer:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const joinServer = async (req: Request, res: Response) => {
    try {
        const { inviteCode } = req.body;
        const supabase = getSupabase(req);
        const user = req.user;

        // Fetch profile to get profile.id
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!profile) {
            res.status(400).json({ error: 'Profile not found' });
            return;
        }

        const { data: server } = await supabase
            .from('servers')
            .select('*')
            .eq('invite_code', inviteCode)
            .single();

        if (!server) {
            res.status(404).json({ error: 'Invalid invite code' });
            return;
        }


        const { data: existing } = await supabase
            .from('server_members')
            .select('id')
            .eq('server_id', server.id)
            .eq('profile_id', profile.id)
            .maybeSingle();

        if (existing) {
            res.status(400).json({ error: 'Already a member', server });
            return;
        }

        await supabase.from('server_members').insert({
            server_id: server.id,
            profile_id: profile.id,
        });

        res.json(server);
    } catch (error: any) {
        console.error("Error in joinServer:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getChannels = async (req: Request, res: Response) => {

    try {
        const { serverId } = req.params;
        const supabase = getSupabase(req);
        const user = req.user;


        const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
        if (!profile) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }


        const { data: server } = await supabase.from('servers').select('owner_id').eq('id', serverId).single();
        const isOwner = server?.owner_id === profile.id;


        let memberRoleIds: string[] = [];
        const { data: member } = await supabase.from('server_members').select('id').eq('server_id', serverId).eq('profile_id', profile.id).single();

        if (member) {
            const { data: roles } = await supabase.from('member_roles').select('role_id').eq('member_id', member.id);
            memberRoleIds = roles?.map((r: any) => r.role_id) || [];
        }

        const { data: channels, error } = await supabase
            .from('channels')
            .select('*')
            .eq('server_id', serverId)
            .order('position');

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }


        const visibleChannels = channels.filter((channel: any) => {
            if (!channel.is_private) return true;
            if (isOwner) return true;

            const allowed = channel.allowed_roles || [];
            if (allowed.length === 0) return false;
            return allowed.some((rid: string) => memberRoleIds.includes(rid));
        });

        res.json(visibleChannels);
    } catch (error: any) {
        console.error("Error in getChannels:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const kickMember = async (req: Request, res: Response) => {
    try {
        const { serverId, memberId } = req.params;
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


        const { data: server } = await supabase
            .from('servers')
            .select('owner_id')
            .eq('id', serverId)
            .single();

        if (!server) {
            res.status(404).json({ error: 'Server not found' });
            return;
        }

        let hasPermission = server.owner_id === requesterProfile.id;


        if (!hasPermission) {
            const { data: requesterMember } = await supabase
                .from('server_members')
                .select('id')
                .eq('server_id', serverId)
                .eq('profile_id', requesterProfile.id)
                .single();

            if (!requesterMember) {
                res.status(403).json({ error: 'Not a member' });
                return;
            }

            const { data: memberRoles } = await supabase
                .from('member_roles')
                .select('role_id, server_roles(permissions)')
                .eq('member_id', requesterMember.id);

            if (memberRoles) {
                hasPermission = memberRoles.some((mr: any) => {
                    const permissions = mr.server_roles?.permissions;

                    return permissions && permissions.can_kick_members === true;
                });
            }
        }

        if (!hasPermission) {
            res.status(403).json({ error: 'Missing permission: can_kick_members' });
            return;
        }


        const { data: targetMember } = await supabase
            .from('server_members')
            .select('id')
            .eq('server_id', serverId)
            .eq('profile_id', memberId)
            .single();

        if (!targetMember) {
            res.status(404).json({ error: 'Member not found in this server' });
            return;
        }



        const { error: deleteError } = await supabase
            .from('server_members')
            .delete()
            .eq('id', targetMember.id);

        if (deleteError) {
            res.status(500).json({ error: deleteError.message });
            return;
        }

        res.json({ message: 'Member kicked successfully' });

    } catch (error: any) {
        console.error("Error in kickMember:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
