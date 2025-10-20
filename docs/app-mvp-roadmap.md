# Ocepa AI Tutor - MVP Roadmap & Architecture

This document outlines the product vision, minimum viable product (MVP) features, architectural decisions, and future roadmap for the Ocepa AI Tutor application.

## 1. Project Overview & Core Purpose

Ocepa AI is an AI-powered research, reasoning, and answering assistant for Ugandan A'Level secondary school science students. It's specifically designed to align with the new competence-based curriculum, which emphasizes scenario-based learning and critical thinking over rote memorization.

-   **Target Audience:** Ugandan A'Level students studying Biology, Chemistry, Physics, and Mathematics.
-   **Core Value Proposition:** Provide instant, curriculum-aligned, and locally relevant tutoring that helps students develop critical thinking and problem-solving skills.

---

## 2. MVP Scope & Features

The initial version of the application focuses on delivering the core chat-based tutoring experience.

### Core Functionality:
-   **AI-Powered Chat:** A clean, intuitive chat interface where students can ask questions and receive answers.
-   **Curriculum-Aligned Persona:** The AI is guided by a comprehensive system prompt that defines its role as a Ugandan A'Level tutor, ensuring responses are accurate, relevant, and follow a specific structure for scenario-based vs. direct questions.
-   **Chat History:** Users can create multiple chat sessions, and the history is preserved for them to revisit.
-   **Local Persistence:** All chat data is stored directly in the user's browser using `localStorage`, making the app work offline (with existing data) and preserving history between sessions without needing a backend or user accounts.
-   **Responsive Design:** The user interface is fully responsive and works seamlessly on both mobile and desktop devices.
-   **Secure Deployment:** The application is deployed with a secure architecture that protects the API key from being exposed to the public.

---

## 3. MVP Status: Complete & Deployed

-   ✅ **Sending & Receiving Messages:** Users can type questions and get responses from the Gemini AI model.
-   ✅ **Chat Session Management:** Users can start new chats, switch between previous conversations, rename chats, and delete chats.
-   ✅ **Persistent History:** Chat sessions are saved to `localStorage` and are available when the user re-opens the app.
-   ✅ **Responsive UI:** The layout correctly adapts to different screen sizes, with a collapsible sidebar on mobile.
-   ✅ **Loading State:** A visual indicator shows when the AI is processing a request.
-   ✅ **AI Persona Adherence:** The AI successfully follows the detailed instructions in the system prompt to tailor its responses.
-   ✅ **Markdown Rendering:** AI responses are parsed as Markdown, correctly displaying lists, bold/italic text, and other rich formatting.
-   ✅ **Secure & Deployed:** The app is successfully deployed on Netlify. The Gemini API key is fully protected by a serverless function proxy.

---

## 4. Architectural Decisions

The architecture for the MVP was chosen to prioritize simplicity, rapid development, and a modern user experience.

-   **Frontend Framework:** **React with TypeScript**.
    -   **Why:** React is a mature and powerful library for building interactive UIs. TypeScript adds static typing, which significantly improves code quality, maintainability, and developer experience by catching errors early.

-   **Styling:** **Tailwind CSS**.
    -   **Why:** It's a utility-first CSS framework that allows for rapid UI development directly within the HTML/JSX. This approach avoids the need for separate CSS files, simplifies component styling, and makes it easy to maintain a consistent design system.

-   **AI Integration:** **Google Gemini API (`@google/genai` SDK)**.
    -   **Why:** The Gemini family of models is powerful and versatile. The `gemini-2.5-flash` model provides a great balance of speed and capability for a chat application. The official SDK simplifies the process of making API calls.

-   **State Management:** **React Hooks (`useState`, `useEffect`)**.
    -   **Why:** For the scope of the MVP, React's built-in state management is sufficient. The application state is managed in the top-level `App.tsx` component and passed down to child components via props.

-   **Data Persistence:** **Browser `localStorage`**.
    -   **Why:** `localStorage` is the simplest way to achieve data persistence on the client-side. It requires no server, no database, and no user authentication, making it perfect for an MVP.

-   **Build Process:** **No-Build-Step with Import Maps**.
    -   **Why:** To keep the setup simple and fast, the project uses an `importmap` in `index.html`. This allows the browser to directly import modules from a CDN without needing a local build tool like Vite or Webpack.

-   **Deployment & Security:** **Netlify with Serverless Functions**.
    -   **Why:** Netlify provides free, robust hosting with a seamless Git-based workflow (Continuous Deployment). To secure the Gemini API key, we use a **serverless function** as a proxy. The frontend app calls our own serverless function, which then securely adds the `API_KEY` (stored as a secret environment variable on Netlify) and calls the Google API. This critical step ensures the API key is never exposed to the user's browser. Deployment settings are explicitly defined in a `netlify.toml` file within the repository to ensure consistent, reliable builds.

---

## 5. Deployment Summary

-   **Platform:** Netlify
-   **Status:** Live
-   **Frontend:** The static frontend (`index.html`, etc.) is served directly from the root of the repository. There is no build step for the client-side code, as modern browsers handle the ES modules via an import map.
-   **Backend (API Proxy):** A serverless function (`netlify/functions/gemini-proxy.ts`) handles all communication with the Google Gemini API. This function is responsible for securely attaching the `API_KEY`.
-   **Configuration:** Deployment is configured via the `netlify.toml` file in the project's root. This file dictates the publish directory (`.`) and functions directory (`netlify/functions`), overriding any UI settings in Netlify and ensuring consistent deployments.
-   **API Key Management:** The `API_KEY` is stored as a secret environment variable within the Netlify site settings. It is only accessible to the serverless function during its execution, never to the frontend.

---

## 6. Future Roadmap

The following features are planned for future iterations to enhance the application's capabilities and user experience.

-   **User Authentication:** Implement a user login system (e.g., using Firebase Auth) to enable a personalized experience.
-   **Cloud Database Sync:** Replace `localStorage` with a cloud database (like Firestore) to sync user chat history across multiple devices.
-   **Streaming Responses:** Modify the `geminiService` to use the `sendMessageStream` method. This will display the AI's response token-by-token, creating a much more interactive and "live" feel.
-   **Voice Input:** Add a microphone icon to the input field to allow users to ask questions using voice-to-text.
-   **Share/Export Chat:** Add functionality to allow users to share a link to a conversation or export it as a text or PDF file.
-   **Enhanced Error Handling:** Provide more user-friendly and specific error messages for API failures or network issues.