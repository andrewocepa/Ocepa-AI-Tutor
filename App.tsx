
import React, { useState, useEffect } from 'react';
import HistorySidebar from './components/HistorySidebar';
import ChatInterface from './components/ChatInterface';
import { ChatSession } from './types';
import { getChatResponse } from './services/geminiService';

const App: React.FC = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    // Load chats from local storage on initial render
    const savedChats = localStorage.getItem('chatSessions');
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      if (parsedChats.length > 0) {
        setChatSessions(parsedChats);
        setCurrentChatId(parsedChats[0].id);
      }
    }
    // Note: createNewChat is handled by the effect below if chatSessions is empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Save chats to local storage whenever they change
    if(chatSessions.length > 0) {
      localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
    } else {
      localStorage.removeItem('chatSessions');
    }
  }, [chatSessions]);

  useEffect(() => {
    // If there are no chat sessions for any reason, create a new one.
    // This handles the initial load and the case where all chats are deleted.
    if (chatSessions.length === 0 && !isLoading) {
      createNewChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatSessions, isLoading]);
  
  const createNewChat = () => {
    const newChatId = `chat-${Date.now()}`;
    const newChat: ChatSession = {
      id: newChatId,
      title: 'New Chat',
      messages: [],
    };
    setChatSessions(prev => [newChat, ...prev]);
    setCurrentChatId(newChatId);
    if(window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
    if(window.innerWidth < 768) setIsSidebarOpen(false);
  };
  
  const handleRenameChat = (id: string, newTitle: string) => {
    setChatSessions(prev =>
      prev.map(session =>
        session.id === id ? { ...session, title: newTitle } : session
      )
    );
  };

  const handleDeleteChat = (id: string) => {
    setChatSessions(prev => {
      const remainingSessions = prev.filter(session => session.id !== id);
      if (currentChatId === id) {
        // The active chat was deleted, select the next available one or null
        setCurrentChatId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
      }
      return remainingSessions;
    });
  };

  const handleSendMessage = async (messageText: string) => {
    if (!currentChatId) return;

    const userMessage = { role: 'user' as const, text: messageText };
    
    // This variable will hold the updated state to avoid stale closures.
    let updatedSessions: ChatSession[];

    // 1. Update state with the user's message and get the new state.
    setChatSessions(prev => {
        updatedSessions = prev.map(session => {
            if (session.id === currentChatId) {
                const isFirstMessage = session.messages.length === 0;
                // If this is the first message, update the chat title
                const newTitle = isFirstMessage 
                    ? messageText.substring(0, 35) + (messageText.length > 35 ? '...' : '') 
                    : session.title;
                
                return {
                    ...session,
                    title: newTitle,
                    messages: [...session.messages, userMessage],
                };
            }
            return session;
        });
        return updatedSessions;
    });

    setIsLoading(true);

    // 2. Use the *updated* session from the new state to create the API history.
    // The '!' asserts that the session exists, which is safe here.
    const currentSessionForApi = updatedSessions!.find(s => s.id === currentChatId)!;
    
    const aiResponseText = await getChatResponse(currentSessionForApi.messages);
    const aiMessage = { role: 'model' as const, text: aiResponseText };
    
    // 3. Update state with the AI's response.
    setChatSessions(prev => 
        prev.map(session => {
            if (session.id === currentChatId) {
                return { ...session, messages: [...session.messages, aiMessage] };
            }
            return session;
        })
    );

    setIsLoading(false);
  };
  
  const currentChat = chatSessions.find(c => c.id === currentChatId) || null;

  return (
    <div className="flex h-screen font-sans">
      <HistorySidebar
        chatSessions={chatSessions}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={createNewChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        isOpen={isSidebarOpen}
      />
       {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-10 md:hidden"></div>}
      <ChatInterface
        chatSession={currentChat}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        toggleSidebar={() => setIsSidebarOpen(prev => !prev)}
      />
    </div>
  );
};

export default App;
