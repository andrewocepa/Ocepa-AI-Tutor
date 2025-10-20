import { Message } from '../types';

// The new endpoint for our secure serverless function
const API_ENDPOINT = '/.netlify/functions/gemini-proxy';

export const getChatResponse = async (history: Message[]): Promise<string> => {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ history: history }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data.text;

    } catch (error) {
        console.error("Error getting chat response from proxy:", error);
        return "Sorry, I encountered an error while processing your request. Please try again.";
    }
};
