
import { Message } from '../types';

// The new endpoint for our secure serverless function
const API_ENDPOINT = '/.netlify/functions/gemini-proxy';

export const getChatResponseStream = async (
    history: Message[],
    onChunk: (chunk: string) => void,
    signal: AbortSignal
): Promise<void> => {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ history }),
            signal, // Pass the signal to the fetch request
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }
        
        if (!response.body) {
            throw new Error("Response body is empty.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                break;
            }
            onChunk(decoder.decode(value, { stream: true }));
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Stream aborted by user.');
        } else {
            console.error("Error getting chat response from proxy:", error);
            const errorMessage = "\n\nSorry, I encountered an error while processing your request. Please try again.";
            onChunk(errorMessage);
        }
    }
};
