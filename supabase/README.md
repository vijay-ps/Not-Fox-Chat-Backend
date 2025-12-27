# 🚀 Blue Lock Connect - Database Setup

Hey! This folder has everything you need to set up your own version of the **NotFox** database. It's designed to be super easy—just a few commands and you're good to go.

## 🛠️ Quick Start Guide

Follow these steps to get your own backend running in minutes:

### 1. Get Ready

First, make sure you have a Supabase project created.

- Go to [Supabase.com](https://supabase.com/dashboard) and create a **New Project**.
- Go to **Project Settings** -> **General** and copy your **Reference ID** (it's that random string like `uwozatbfcstgr...`).
- Make sure you have the Supabase tool installed:
  ```bash
  npm install -g supabase
  ```

### 2. Connect Your Project

Open your terminal in this folder (`backend/supabase`) or the main backend folder and run:

1.  **Log in to your account:**

    ```bash
    npx supabase login
    ```

2.  **Link your specific project:**
    (Replace `<your-project-id>` with the ID you copied earlier!)

    ```bash
    npx supabase link --project-ref <your-project-id>
    ```

3.  **Push the Magic Button (Deploy):**
    This single command creates all the tables, permissions, and even adds the AI user for you.
    ```bash
    npx supabase db push
    ```
    _If it asks simply type `yes`._

🎉 **That's it!** Your database is now basically identical to the main one.

---

### 🤖 (Optional) Set up AI Chat

If you want the AI Chatbot to work, you need to deploy the "brain" (Edge Function):

1.  **Deploy the function:**

    ```bash
    npx supabase functions deploy ai-chat
    ```

2.  **Add your API Key:**
    The AI needs a Google Gemini API key to think. Get one from Google AI Studio, then run:
    ```bash
    npx supabase secrets set GEMINI_API_KEY=your_actual_api_key_here
    ```

---

### 📂 What's inside this folder?

- `migrations/`: The history book of our database. It teaches Supabase how to build the tables.
- `seed.sql`: The starter pack. It puts the default "NotFox AI" user into your database so the chat works.
- `functions/`: The code for the AI bot.
