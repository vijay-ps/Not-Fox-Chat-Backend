-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'member');

-- Create user status enum
CREATE TYPE public.user_status AS ENUM ('online', 'idle', 'dnd', 'offline');

-- Create channel type enum
CREATE TYPE public.channel_type AS ENUM ('text', 'voice', 'video', 'announcement');

-- Create subscription tier enum
CREATE TYPE public.subscription_tier AS ENUM ('free', 'nitro', 'nitro_boost');

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    bio TEXT,
    status user_status DEFAULT 'offline',
    custom_status TEXT,
    subscription_tier subscription_tier DEFAULT 'free',
    is_verified BOOLEAN DEFAULT false,
    github_url TEXT,
    twitter_url TEXT,
    portfolio_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Servers table
CREATE TABLE public.servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    banner_url TEXT,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    is_public BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    accent_color TEXT DEFAULT '#0ea5e9',
    boost_level INTEGER DEFAULT 0,
    member_count INTEGER DEFAULT 0,
    invite_code TEXT UNIQUE DEFAULT substring(md5(random()::text), 1, 8),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Server members table
CREATE TABLE public.server_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    nickname TEXT,
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(server_id, profile_id)
);

-- Server roles table
CREATE TABLE public.server_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#99aab5',
    permissions JSONB DEFAULT '{}',
    position INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Member roles junction table
CREATE TABLE public.member_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.server_members(id) ON DELETE CASCADE NOT NULL,
    role_id UUID REFERENCES public.server_roles(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(member_id, role_id)
);

-- Channels table
CREATE TABLE public.channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    topic TEXT,
    type channel_type DEFAULT 'text',
    position INTEGER DEFAULT 0,
    is_nsfw BOOLEAN DEFAULT false,
    slowmode_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messages table
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    attachments JSONB DEFAULT '[]',
    embeds JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Message reactions table
CREATE TABLE public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(message_id, profile_id, emoji)
);

-- Direct message conversations
CREATE TABLE public.dm_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- DM participants
CREATE TABLE public.dm_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.dm_conversations(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(conversation_id, profile_id)
);

-- Direct messages
CREATE TABLE public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.dm_conversations(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT false,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Followers table
CREATE TABLE public.followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(follower_id, following_id)
);

-- Nitro subscriptions
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    tier subscription_tier DEFAULT 'nitro',
    started_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    features JSONB DEFAULT '{"animated_avatar": true, "custom_banner": true, "higher_upload_limit": true, "custom_emojis": true}'
);

-- Server boosts
CREATE TABLE public.server_boosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    started_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ
);

-- AI chat history for @AI mentions
CREATE TABLE public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    response TEXT,
    model TEXT DEFAULT 'google/gemini-2.5-flash',
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- User badges
CREATE TABLE public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    badge_type TEXT NOT NULL,
    awarded_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(profile_id, badge_type)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for servers
CREATE POLICY "Public servers are viewable by everyone" ON public.servers FOR SELECT USING (is_public = true OR owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Authenticated users can create servers" ON public.servers FOR INSERT WITH CHECK (owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Server owners can update their servers" ON public.servers FOR UPDATE USING (owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Server owners can delete their servers" ON public.servers FOR DELETE USING (owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS Policies for server_members
CREATE POLICY "Server members are viewable by server members" ON public.server_members FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join servers" ON public.server_members FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can leave servers" ON public.server_members FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS Policies for channels
CREATE POLICY "Channels are viewable by server members" ON public.channels FOR SELECT USING (true);
CREATE POLICY "Server owners can create channels" ON public.channels FOR INSERT WITH CHECK (server_id IN (SELECT id FROM servers WHERE owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));
CREATE POLICY "Server owners can update channels" ON public.channels FOR UPDATE USING (server_id IN (SELECT id FROM servers WHERE owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));
CREATE POLICY "Server owners can delete channels" ON public.channels FOR DELETE USING (server_id IN (SELECT id FROM servers WHERE owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));

-- RLS Policies for messages
CREATE POLICY "Messages are viewable by everyone" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create messages" ON public.messages FOR INSERT WITH CHECK (author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can update their own messages" ON public.messages FOR UPDATE USING (author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete their own messages" ON public.messages FOR DELETE USING (author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS Policies for message_reactions
CREATE POLICY "Reactions are viewable by everyone" ON public.message_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add reactions" ON public.message_reactions FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can remove their own reactions" ON public.message_reactions FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS Policies for DMs
CREATE POLICY "DM conversations viewable by participants" ON public.dm_conversations FOR SELECT USING (id IN (SELECT conversation_id FROM dm_participants WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));
CREATE POLICY "Authenticated users can create DM conversations" ON public.dm_conversations FOR INSERT WITH CHECK (true);

CREATE POLICY "DM participants viewable by conversation members" ON public.dm_participants FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR conversation_id IN (SELECT conversation_id FROM dm_participants WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));
CREATE POLICY "Authenticated users can add DM participants" ON public.dm_participants FOR INSERT WITH CHECK (true);

CREATE POLICY "Direct messages viewable by conversation members" ON public.direct_messages FOR SELECT USING (conversation_id IN (SELECT conversation_id FROM dm_participants WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));
CREATE POLICY "Conversation members can send direct messages" ON public.direct_messages FOR INSERT WITH CHECK (author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS Policies for followers
CREATE POLICY "Followers are viewable by everyone" ON public.followers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can follow" ON public.followers FOR INSERT WITH CHECK (follower_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can unfollow" ON public.followers FOR DELETE USING (follower_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription" ON public.subscriptions FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "System can manage subscriptions" ON public.subscriptions FOR ALL USING (true);

-- RLS Policies for server_boosts
CREATE POLICY "Server boosts are viewable" ON public.server_boosts FOR SELECT USING (true);
CREATE POLICY "Nitro users can boost servers" ON public.server_boosts FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS Policies for AI conversations
CREATE POLICY "Users can view their own AI conversations" ON public.ai_conversations FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Authenticated users can create AI conversations" ON public.ai_conversations FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS Policies for user_badges
CREATE POLICY "Badges are viewable by everyone" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "System can award badges" ON public.user_badges FOR INSERT WITH CHECK (true);

-- RLS Policies for server_roles
CREATE POLICY "Roles are viewable by everyone" ON public.server_roles FOR SELECT USING (true);
CREATE POLICY "Server owners can manage roles" ON public.server_roles FOR ALL USING (server_id IN (SELECT id FROM servers WHERE owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));

-- RLS Policies for member_roles
CREATE POLICY "Member roles are viewable" ON public.member_roles FOR SELECT USING (true);
CREATE POLICY "Server owners can assign roles" ON public.member_roles FOR ALL USING (true);

-- Enable realtime for messages and direct_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update member count
CREATE OR REPLACE FUNCTION public.update_server_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE servers SET member_count = member_count + 1 WHERE id = NEW.server_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE servers SET member_count = member_count - 1 WHERE id = OLD.server_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_server_member_change
  AFTER INSERT OR DELETE ON public.server_members
  FOR EACH ROW EXECUTE FUNCTION public.update_server_member_count();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_servers_updated_at BEFORE UPDATE ON public.servers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON public.channels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_direct_messages_updated_at BEFORE UPDATE ON public.direct_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();