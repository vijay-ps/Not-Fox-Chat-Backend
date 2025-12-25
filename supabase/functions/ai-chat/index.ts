
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const systemPrompt = `You are NotFox AI, an intelligent assistant integrated into the NotFox Development Discord platform.
    
${context ? `Current context: ${context}` : ''}

Respond helpfully and concisely.`;

    // Construct the prompt for Gemini
    // Extract the latest user message or concatenate messages
    const lastMessage = messages[messages.length - 1]?.content || "Hello";
    const fullPrompt = `${systemPrompt}\nUser: ${lastMessage}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", response.status, errorText);
      return new Response(JSON.stringify({ error: `Gemini API Error: ${errorText}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble thinking right now.";

    // Return JSON response (standard for this function context)
    return new Response(JSON.stringify({ response: aiText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
