-- Seed Data

-- 1. Insert built-in AI Agent profile
INSERT INTO public.profiles (id, user_id, username, display_name, avatar_url, bio, status, subscription_tier)
VALUES (
    '06e81cb9-aac4-49f6-818e-2ca59f60267b', 
    '00000000-0000-0000-0000-000000000000', -- Virtual AI User
    'NotFox AI', 
    'NotFox Assistant', 
    'https://api.dicebear.com/7.x/bottts/svg?seed=NotFoxAI',
    'I am the built-in AI assistant for NotFox. Mention me using @AI to get help!',
    'online',
    'nitro'
) ON CONFLICT (id) DO NOTHING;
