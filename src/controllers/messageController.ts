import { Request, Response } from 'express';

import { createClient } from '@supabase/supabase-js';

const getSupabase = (req: Request) => {
    if (!req.supabase) {
        throw new Error('Supabase client not found on request');
    }
    return req.supabase;
};

export const getMessages = async (req: Request, res: Response) => {
    const { channelId } = req.params;
    const supabase = getSupabase(req);

    const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          author:profiles!messages_author_id_fkey(
            id, username, display_name, avatar_url, status, subscription_tier
          ),
          reply_to:messages!messages_reply_to_id_fkey(
            id, content, author_id, is_deleted,
            author:profiles!messages_author_id_fkey(
                id, username, display_name, avatar_url
            )
          )
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100);

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }

    const messageIds = (data || []).map((msg: any) => msg.id);
    const { data: allReactions } = await supabase
        .from('message_reactions')
        .select('message_id, emoji')
        .in('message_id', messageIds);

    const messagesWithReactions = (data || []).map((msg: any) => {
        const reactions = allReactions?.filter((r: any) => r.message_id === msg.id) || [];
        const reactionCounts = reactions.reduce((acc: any, r: any) => {
            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
            return acc;
        }, {});

        return {
            ...msg,
            reactions: Object.entries(reactionCounts).map(([emoji, count]) => ({
                emoji,
                count,
            })),
        };
    });

    res.json(messagesWithReactions);
};

export const sendMessage = async (req: Request, res: Response) => {
    const { channelId, content, replyToId } = req.body;
    const supabase = getSupabase(req);
    const user = req.user;


    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!profile) {
        res.status(400).json({ error: 'Profile not found' });
        return;
    }

    const { data, error } = await supabase
        .from('messages')
        .insert({
            channel_id: channelId,
            author_id: profile.id,
            content,
            reply_to_id: replyToId || null,
            attachments: req.body.attachments || [],
        })
        .select(`
      *,
      author:profiles!messages_author_id_fkey(
        id, username, display_name, avatar_url, status, subscription_tier
      )
    `)
        .single();

    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }

    res.json(data);


    if (content.toLowerCase().includes('@ai')) {
        handleAIResponse(channelId, content, user.id);
    }
};

const handleAIResponse = async (channelId: string, userContent: string, userId: string) => {

    const AI_PROFILE_ID = '06e81cb9-aac4-49f6-818e-2ca59f60267b';
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        console.error('[AI] GEMINI_API_KEY missing');
        return;
    }

    try {


        const prompt = `You are NotFox AI, a helpful assistant in a Discord-like chat. 
User said: "${userContent}". 
Respond helpfully and concisely.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            console.error('[AI] Gemini API error:', response.status, await response.text());
            return;
        }

        const result = await response.json();
        const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble thinking right now.";



        const supabaseUrl = process.env.SUPABASE_URL!;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!serviceRoleKey) {
            console.error('[AI] SUPABASE_SERVICE_ROLE_KEY missing');
            return;
        }


        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);


        const { data: channelData } = await supabaseAdmin
            .from('channels')
            .select('server_id')
            .eq('id', channelId)
            .single();

        if (channelData?.server_id) {

            const { error: joinError } = await supabaseAdmin
                .from('server_members')
                .insert({
                    server_id: channelData.server_id,
                    profile_id: AI_PROFILE_ID
                });

            if (joinError && !joinError.message.includes('duplicate')) {
                console.error('[AI] Error joining server:', joinError);
            } else {

            }
        }


        const { error: insertError } = await supabaseAdmin.from('messages').insert({
            channel_id: channelId,
            author_id: AI_PROFILE_ID,
            content: aiText,
        });

        if (insertError) {
            console.error('[AI] Insert error:', insertError);
        } else {

        }

    } catch (error) {
        console.error('Error in handleAIResponse:', error);
    }
};

export const deleteMessage = async (req: Request, res: Response) => {
    const { messageId } = req.params;
    const supabase = getSupabase(req);

    // Use 'embeds' to store deletion info as a workaround for missing 'is_deleted' column
    const { error } = await supabase
        .from('messages')
        .update({
            embeds: [{ type: 'deleted', deleted_at: new Date().toISOString() }]
        })
        .eq('id', messageId);

    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }

    res.json({ message: 'Message soft-deleted' });
};
