
import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { ChatSession, Message } from '../types';
import SendIcon from './icons/SendIcon';
import MenuIcon from './icons/MenuIcon';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface ChatInterfaceProps {
  chatSession: ChatSession | null;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  toggleSidebar: () => void;
}

const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
    const isUser = message.role === 'user';

    const renderMessageContent = () => {
        if (isUser) {
            return <p className="whitespace-pre-wrap">{message.text}</p>;
        }
        // For model messages, parse markdown and sanitize
        const rawMarkup = marked.parse(message.text) as string;
        const sanitizedMarkup = DOMPurify.sanitize(rawMarkup);

        return (
            <div
                className="prose prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-headings:my-3 prose-blockquote:my-2"
                dangerouslySetInnerHTML={{ __html: sanitizedMarkup }}
            />
        );
    };

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div
                className={`max-w-xl lg:max-w-3xl p-4 rounded-2xl ${
                isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'
                }`}
            >
                {renderMessageContent()}
            </div>
        </div>
    );
};

const LoadingIndicator: React.FC = () => (
    <div className="flex justify-start mb-4">
        <div className="bg-gray-700 text-gray-200 p-4 rounded-2xl rounded-bl-none flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse"></span>
            <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse delay-75"></span>
            <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse delay-150"></span>
        </div>
    </div>
);


const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatSession, onSendMessage, isLoading, toggleSidebar }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatSession?.messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-gray-800">
      <header className="p-4 flex items-center bg-gray-900 border-b border-gray-700 md:hidden">
        <button onClick={toggleSidebar} className="p-2 mr-4 rounded-full hover:bg-gray-700 transition-colors">
            <MenuIcon/>
        </button>
        <h1 className="text-xl font-bold">{chatSession?.title || 'Ocepa AI Tutor'}</h1>
      </header>
      <div className="flex-1 p-6 overflow-y-auto">
        {chatSession ? (
          <>
            {chatSession.messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} />
            ))}
            {isLoading && <LoadingIndicator/>}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <h2 className="text-2xl font-semibold">Welcome to Ocepa AI</h2>
              <p>Your A'Level Science study partner.</p>
              <p>Start a new chat or select one from the history.</p>
            </div>
          </div>
        )}
         <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-gray-900 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="flex items-center space-x-4">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                }
            }}
            placeholder="Type your question here..."
            className="flex-1 p-3 bg-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="p-3 bg-blue-600 rounded-full text-white disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </form>
      </div>
    </main>
  );
};

export default ChatInterface;