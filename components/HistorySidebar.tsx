import React, { useState, useEffect, useRef } from 'react';
import { ChatSession } from '../types';
import PlusIcon from './icons/PlusIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';

interface HistorySidebarProps {
  chatSessions: ChatSession[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onDeleteChat: (id: string) => void;
  isOpen: boolean;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ chatSessions, currentChatId, onSelectChat, onNewChat, onRenameChat, onDeleteChat, isOpen }) => {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingChatId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingChatId]);

  const handleStartRename = (session: ChatSession) => {
    setEditingChatId(session.id);
    setRenameValue(session.title);
  };

  const handleRenameSubmit = () => {
    if (editingChatId && renameValue.trim()) {
      onRenameChat(editingChatId, renameValue.trim());
    }
    setEditingChatId(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setEditingChatId(null);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent the chat from being selected
    if (window.confirm("Are you sure you want to delete this chat?")) {
      onDeleteChat(id);
    }
  };

  return (
    <aside className={`absolute md:relative z-20 h-full bg-gray-900 text-white flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-64 md:w-72 border-r border-gray-700`}>
      <div className="p-4 flex justify-between items-center border-b border-gray-700">
        <h2 className="text-xl font-bold">Previous Chats</h2>
        <button
          onClick={onNewChat}
          className="p-2 rounded-full hover:bg-gray-700 transition-colors"
          aria-label="New Chat"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        <ul>
          {chatSessions.map((session) => (
            <li key={session.id} className="mb-2">
              {editingChatId === session.id ? (
                <input
                  ref={renameInputRef}
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={handleRenameKeyDown}
                  className="w-full p-3 bg-gray-700 rounded-lg text-white outline-none ring-2 ring-blue-500"
                />
              ) : (
                <div
                  onClick={() => onSelectChat(session.id)}
                  className={`group w-full text-left p-3 rounded-lg truncate transition-colors flex justify-between items-center cursor-pointer ${
                    currentChatId === session.id ? 'bg-blue-600' : 'hover:bg-gray-800'
                  }`}
                >
                  <span className="flex-1 truncate">{session.title}</span>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button
                        onClick={(e) => { e.stopPropagation(); handleStartRename(session); }}
                        className="p-1 rounded hover:bg-gray-700"
                        aria-label="Rename chat"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, session.id)}
                        className="p-1 rounded hover:bg-gray-700"
                        aria-label="Delete chat"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">Ocepa AI Tutor</p>
      </div>
    </aside>
  );
};

export default HistorySidebar;
