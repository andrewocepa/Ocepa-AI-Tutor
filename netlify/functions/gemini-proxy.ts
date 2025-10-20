
import { GoogleGenAI, Content, GenerateContentResponse } from "@google/genai";
import { OCEPA_AI_SYSTEM_PROMPT } from '../../constants';

// The 'Handler' and 'HandlerEvent' types are provided by Netlify's functions environment.
interface HandlerEvent {
  body: string;
}

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set in Netlify function environment.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = 'gemini-2.5-flash';

// This is a streaming function handler for Netlify
export default async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Only POST requests are allowed' }), { status: 405 });
  }

  if (!request.body) {
    return new Response(JSON.stringify({ error: 'No request body found' }), { status: 400 });
  }

  try {
    const { history } = await request.json();

    if (!Array.isArray(history) || history.length === 0) {
      return new Response(JSON.stringify({ error: 'Request body must contain a non-empty "history" array.' }), { status: 400 });
    }
    
    const contents: Content[] = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    // The last message is the new prompt. The rest is the chat history.
    const lastMessage = contents.pop();
    if (!lastMessage || lastMessage.role !== 'user' || !lastMessage.parts[0]?.text) {
        return new Response(JSON.stringify({ error: 'The last message in history must be from the user.' }), { status: 400 });
    }
    const currentPrompt = lastMessage.parts[0].text;
    const chatHistory = contents;

    const chat = ai.chats.create({
        model: model,
        history: chatHistory,
        config: {
            systemInstruction: OCEPA_AI_SYSTEM_PROMPT,
        }
    });

    const stream = await chat.sendMessageStream({ message: currentPrompt });
    
    // Create a new ReadableStream to send back to the client
    const readableStream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                if (chunkText) {
                    controller.enqueue(encoder.encode(chunkText));
                }
            }
            controller.close();
        },
    });

    return new Response(readableStream, {
      headers: { 
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff', // Security header
      },
    });

  } catch (error) {
    console.error("Error in serverless function:", error);
    return new Response(JSON.stringify({ error: 'Failed to get response from Gemini API.' }), { status: 500 });
  }
};
