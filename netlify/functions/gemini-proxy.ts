import { GoogleGenAI, Content } from "@google/genai";
import { OCEPA_AI_SYSTEM_PROMPT } from '../../constants';

// The 'Handler' type is provided by Netlify's functions environment.
// We are defining it here for clarity as we don't have Netlify's types package.
interface HandlerEvent {
  body: string;
}

interface HandlerResponse {
  statusCode: number;
  body: string;
}

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This will cause the function to fail gracefully if the API key is not set
  throw new Error("API_KEY environment variable not set in Netlify function environment.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = 'gemini-2.5-flash';

export async function handler(event: HandlerEvent): Promise<HandlerResponse> {
  // Netlify functions are triggered by HTTP requests. We expect a POST request.
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No request body found' }),
    };
  }

  try {
    const { history } = JSON.parse(event.body);

    if (!Array.isArray(history) || history.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Request body must contain a non-empty "history" array.' }),
      };
    }
    
    const contents: Content[] = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    // The last message is the new prompt. The rest is the chat history.
    const lastMessage = contents.pop();
    if (!lastMessage || lastMessage.role !== 'user' || !lastMessage.parts[0]?.text) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'The last message in history must be from the user.' }),
        };
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

    const response = await chat.sendMessage({ message: currentPrompt });

    return {
      statusCode: 200,
      body: JSON.stringify({ text: response.text }),
    };

  } catch (error) {
    console.error("Error in serverless function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get response from Gemini API.' }),
    };
  }
}
