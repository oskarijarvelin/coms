'use client';

import { useState, useEffect, useRef } from 'react';
import { useConnectionState, useDataChannel as useLivekitDataChannel } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { icons, iconSizes } from '@/config/icons';

const CHAT_TOPIC = 'lk.chat' as const;

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

function useDataChannel() {
  const textDecoderRef = useRef<TextDecoder | null>(null);
  const textEncoderRef = useRef<TextEncoder | null>(null);
  const [messages, setMessages] = useState<StoredMessage[]>([]);

  const connectionState = useConnectionState();
  const { send: sendBytes, isSending, message } = useLivekitDataChannel(CHAT_TOPIC);

  useEffect(() => {
    if (!message) return;

    if (!textDecoderRef.current) {
      textDecoderRef.current = new TextDecoder();
    }

    const decoded = textDecoderRef.current.decode(message.payload);
    const timestamp = Date.now();
    const fromIdentity = message.from?.identity || 'Unknown';
    const fromName = message.from?.name || fromIdentity;

    setMessages((prev) => [
      ...prev,
      {
        id: `${timestamp}-${fromIdentity}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp,
        message: decoded,
        fromIdentity,
        fromName,
      },
    ]);
  }, [message]);

  const send = async (payload: string) => {
    if (
      connectionState === ConnectionState.Disconnected ||
      connectionState === ConnectionState.Connecting
    ) {
      throw new Error(`Data channel not ready (state: ${connectionState})`);
    }

    if (!textEncoderRef.current) {
      textEncoderRef.current = new TextEncoder();
    }

    const bytes = textEncoderRef.current.encode(payload);
    await sendBytes(bytes, { reliable: true });
  };

  return { send, isSending, messages, connectionState } as const;
}

export default function TextChat({ roomName, userName }: TextChatProps) {
  const { send, isSending, messages: chatMessages, connectionState } = useDataChannel();
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
      setAllMessages(prevMessages => {
        // Merge new messages with existing ones, avoiding duplicates
        const messageMap = new Map<string, StoredMessage>();

        // Add existing messages
        prevMessages.forEach(msg => messageMap.set(msg.id, msg));

        // Add/update with new messages
        chatMessages.forEach(msg => messageMap.set(msg.id, msg));

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
      const timestamp = Date.now();

      setAllMessages(prevMessages => {
        const next: StoredMessage[] = [
          ...prevMessages,
          {
            id: `${timestamp}-${userName}-${Math.random().toString(36).substring(2, 9)}`,
            timestamp,
            message: inputMessage.trim(),
            fromIdentity: userName,
            fromName: userName,
          },
        ];

        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch (error) {
          console.error('Error saving chat history:', error);
        }

        return next;
      });
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      const details = error instanceof Error ? error.message : String(error);
      alert(`Viestin lähetys epäonnistui.\n\nSyy: ${details}`);
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

  const canSend =
    connectionState !== ConnectionState.Disconnected &&
    connectionState !== ConnectionState.Connecting &&
    !isSending;

  return (
    <div className="flex flex-col h-[500px] bg-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center gap-2">
          <icons.chat className={iconSizes.lg + ' text-blue-400'} />
          <div>
            <h3 className="text-lg font-semibold text-white">Tekstichat</h3>
            <p className="text-xs text-gray-400">
              {allMessages.length} viestiä • {connectionState}
            </p>
          </div>
        </div>
        <button
          onClick={clearHistory}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors"
          title="Tyhjennä historia"
        >
          <icons.delete className={iconSizes.sm} />
          Tyhjennä
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
            disabled={!canSend}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || !canSend}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            <icons.send className={iconSizes.md} />
          </button>
        </div>
      </form>
    </div>
  );
}
