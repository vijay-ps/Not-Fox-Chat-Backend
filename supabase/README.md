# Supabase Setup Guide

This directory contains everything needed to set up the database environment for **Blue Lock Connect**.

## Getting Started

To get the project running with your own Supabase instance, follow these steps:

### 1. Execute SQL Schema

The easiest way to set up your database is to copy the contents of `full_schema.sql` and run them in the **SQL Editor** of your Supabase Dashboard.

1.  Open your [Supabase Project](https://supabase.com/dashboard).
2.  Go to the **SQL Editor** in the left sidebar.
3.  Click **New Query**.
4.  Paste the entire content of `full_schema.sql`.
5.  Click **Run**.

### 2. Manual Setup (Alternative)

If you prefer using the Supabase CLI, you can push the migrations:

1.  Install Supabase CLI: `npm install -g supabase`
2.  Login: `supabase login`
3.  Initialize (if not done): `supabase init`
4.  Link your project: `supabase link --project-ref your-project-ref`
5.  Push migrations: `supabase db push`

_Note: The `migrations/` folder contains historical incremental changes, while `full_schema.sql` is a consolidated snapshot._

### 3. Storage Configuration

The `full_schema.sql` automatically creates the `chat-attachments` bucket. Ensure:

- The bucket is set to **Public**.
- RLS policies allow authenticated users to upload files.

### 4. Edge Functions

If you are using the AI features, you need to deploy the `ai-chat` function:

```bash
supabase functions deploy ai-chat
supabase secrets set GEMINI_API_KEY=your_key_here
```

## Database Architecture Overview

- **Profiles**: Extends `auth.users` with social and status info.
- **Servers & Channels**: Core organizational structure.
- **Messages & DMs**: Real-time communication tables.
- **Friendships**: Relationship management.
- **Realtime**: Enabled for Messages, DMs, and Notifications.
