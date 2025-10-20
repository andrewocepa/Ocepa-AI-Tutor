
import React, { useState, useEffect, useRef } from 'react';
import HistorySidebar from './components/HistorySidebar';
import ChatInterface from './components/ChatInterface';
import { ChatSession } from './types';
import { getChatResponseStream } from './services/geminiService';

const App: React.FC = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
        setIsLoading(false);
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!currentChatId || isLoading) return;

    const userMessage = { role: 'user' as const, text: messageText };
    
    // This variable will hold the updated state to avoid stale closures.
    let updatedSessions: ChatSession[];
    let currentSessionForApi: ChatSession;

    setChatSessions(prev => {
        updatedSessions = prev.map(session => {
            if (session.id === currentChatId) {
                const isFirstMessage = session.messages.length === 0;
                const newTitle = isFirstMessage 
                    ? messageText.substring(0, 35) + (messageText.length > 35 ? '...' : '') 
                    : session.title;
                
                currentSessionForApi = {
                    ...session,
                    title: newTitle,
                    messages: [...session.messages, userMessage],
                };
                return currentSessionForApi;
            }
            return session;
        });
        return updatedSessions;
    });

    setIsLoading(true);
    
    // Add empty model message placeholder for streaming
    setChatSessions(prev => 
        prev.map(session => {
            if (session.id === currentChatId) {
                return { ...session, messages: [...session.messages, { role: 'model', text: '' }] };
            }
            return session;
        })
    );

    abortControllerRef.current = new AbortController();

    try {
        await getChatResponseStream(
            currentSessionForApi!.messages,
            (chunk) => {
                setChatSessions(prev => 
                    prev.map(session => {
                        if (session.id === currentChatId) {
                            const lastMessage = session.messages[session.messages.length - 1];
                            const updatedMessage = { ...lastMessage, text: lastMessage.text + chunk };
                            const updatedMessages = [...session.messages.slice(0, -1), updatedMessage];
                            return { ...session, messages: updatedMessages };
                        }
                        return session;
                    })
                );
            },
            abortControllerRef.current.signal
        );
    } catch (error) {
        console.error("Failed to get streaming response:", error);
    } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
    }
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
        onStopGenerating={handleStopGenerating}
      />
    </div>
  );
};

export default App;
