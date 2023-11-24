import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4.19.0";
import { OpenAIAssistantRunnable } from "https://esm.sh/langchain@0.0.196/experimental/openai_assistant"

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Expose-Headers": "Content-Length, X-JSON",
  "Access-Control-Allow-Headers": "apikey,X-Client-Info, Content-Type, Authorization, Accept, Accept-Language, X-Authorization",  
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
      return new Response(
          'ok',
          {
              headers: {
                 ...corsHeaders,
              }
          }
      );
  }
  if (req.method === "POST") {
    const formData = await req.formData();
    const audioFile = formData.get("audio");
    const threadId = formData.get("threadId");

    if (audioFile instanceof File) {
      const openai = new OpenAI({
        apiKey: Deno.env.get("OPENAI_API_KEY"),
      }); // Initialize OpenAI client

      try {
        // Call OpenAI's Whisper model for transcription
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1",
        });

        // Call OpenAI's assistants API using langchain
        const assistantId = Deno.env.get("OPENAI_ASSISTANT_ID") || '';
        const assistant = new OpenAIAssistantRunnable({
          assistantId: assistantId,
        });

        let assistantResponse = {};

        if (threadId) {
          console.log(`Continuing conversation with threadId: ${threadId}`);
          // Call OpenAI's assistants API using langchain
          assistantResponse = await assistant.invoke({
            content: transcription.text,
            threadId: threadId,
          });
        } else {
          console.log("No threadId, starting new conversation");
          assistantResponse = await assistant.invoke({
            content: transcription.text,
          });
        }

        // Transform response to audio using openai.audio.speechs.create
        const response = await openai.audio.speech.create({
          model: "tts-1",
          voice: "nova",
          input: (assistantResponse as any[])[0].content[0].text.value,
        });
        

        // return as multipart response with transcription and audio
        const formData = new FormData();
        const blob = await response.blob();
        
        const threadIdResponse = (assistantResponse as any[])[0].thread_id;
        formData.append("audio", blob);
        formData.append("threadId", threadIdResponse);

        return new Response(formData, { status: 200, headers: corsHeaders });
      } catch (err) {
        console.error("Error transcribing audio:", err);
        return new Response("Error transcribing audio", { status: 500, headers: corsHeaders });
      }
    } else {
      return new Response("Invalid file format", { status: 400, headers: corsHeaders });
    }
  } else {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }
})
