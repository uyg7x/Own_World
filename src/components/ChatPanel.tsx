import { useRef, useEffect } from 'react';
import { Trash2, Sparkles } from 'lucide-react';
import type { Message } from '../types';

interface ChatPanelProps {
  messages: Message[];
  isTyping: boolean;
  onClear: () => void;
}

export function ChatPanel({ messages, isTyping, onClear }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>Chat</h3>
        {messages.length > 0 && (
          <button className="clear-btn" onClick={onClear} title="Clear chat">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="empty-state">
            <span className="welcome-emoji">👋</span>
            <p>Namaste Bhai!</p>
            <p className="welcome-sub">Kya haal hai? Baat kar, I'm here!</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role} ${message.isAutoComfort ? 'auto-comfort' : ''}`}
          >
            {message.isAutoComfort && (
              <span className="message-tag">
                <Sparkles size={12} />
                Auto-Comfort
              </span>
            )}
            <div className="message-content">{message.content}</div>
            <div className="message-time">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="message assistant typing">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
