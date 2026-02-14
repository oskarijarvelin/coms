'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@livekit/components-react';

interface StoredMessage {
  id: string;
  timestamp: number;
  message: string;
  fromIdentity: string;
  fromName?: string;
}

interface TextChatProps {
  roomName: string;
  userName: string;
}

export default function TextChat({ roomName, userName }: TextChatProps) {
  const { chatMessages, send, isSending } = useChat();
  const [inputMessage, setInputMessage] = useState('');
  const [allMessages, setAllMessages] = useState<StoredMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const storageKey = `chat_${roomName}`;

  // Load messages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const messages = JSON.parse(stored) as StoredMessage[];
        setAllMessages(messages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }, [storageKey]);

  // Update allMessages when new chatMessages arrive
  useEffect(() => {
    if (chatMessages.length > 0) {
      const newMessages: StoredMessage[] = chatMessages.map(msg => ({
        id: msg.id || `${msg.timestamp}-${msg.from?.identity || 'unknown'}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: msg.timestamp,
        message: msg.message,
        fromIdentity: msg.from?.identity || 'Unknown',
        fromName: msg.from?.name || msg.from?.identity || 'Unknown',
      }));

      setAllMessages(prevMessages => {
        // Merge new messages with existing ones, avoiding duplicates
        const messageMap = new Map<string, StoredMessage>();
        
        // Add existing messages
        prevMessages.forEach(msg => messageMap.set(msg.id, msg));
        
        // Add/update with new messages
        newMessages.forEach(msg => messageMap.set(msg.id, msg));
        
        // Convert back to array and sort by timestamp
        const merged = Array.from(messageMap.values()).sort((a, b) => a.timestamp - b.timestamp);
        
        // Save to localStorage
        try {
          localStorage.setItem(storageKey, JSON.stringify(merged));
        } catch (error) {
          console.error('Error saving chat history:', error);
        }
        
        return merged;
      });
    }
  }, [chatMessages, storageKey]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isSending) {
      return;
    }

    try {
      await send(inputMessage.trim());
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Viestin lähetys epäonnistui. Yritä uudelleen.');
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fi-FI', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const clearHistory = () => {
    if (window.confirm('Haluatko varmasti tyhjentää keskusteluhistorian?')) {
      localStorage.removeItem(storageKey);
      setAllMessages([]);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex justify-between items-center border-b border-gray-700">
        <div>
          <h3 className="text-lg font-semibold text-white">💬 Tekstichat</h3>
          <p className="text-xs text-gray-400">{allMessages.length} viestiä</p>
        </div>
        <button
          onClick={clearHistory}
          className="text-xs text-gray-400 hover:text-red-400 transition-colors"
          title="Tyhjennä historia"
        >
          🗑️ Tyhjennä
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {allMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Ei viestejä vielä.</p>
            <p className="text-sm mt-2">Aloita keskustelu lähettämällä ensimmäinen viesti!</p>
          </div>
        ) : (
          allMessages.map((msg) => {
            const isOwnMessage = msg.fromIdentity === userName;
            
            return (
              <div
                key={msg.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    isOwnMessage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-sm">
                      {isOwnMessage ? 'Sinä' : msg.fromName}
                    </span>
                    <span className="text-xs opacity-70">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {msg.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-gray-900 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Kirjoita viesti..."
            disabled={isSending}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isSending}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors duration-200"
          >
            {isSending ? '📤' : '📨'}
          </button>
        </div>
      </form>
    </div>
  );
}
