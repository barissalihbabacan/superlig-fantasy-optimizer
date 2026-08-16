import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToChat, sendChatMessage, ChatMessage } from '../services/firebase';
import { Send, MessageSquare, LogIn, Sparkles, Shield, User as UserIcon } from 'lucide-react';

interface CommunityChatProps {
  topicId: string; // 'global' | `match_${fixtureId}` | `player_${playerId}`
  title?: string;
  subtitle?: string;
  placeholder?: string;
  emptyNotice?: string;
  className?: string;
}

export const CommunityChat: React.FC<CommunityChatProps> = ({
  topicId,
  title = 'Canlı Tribün & Fantezi Sohbeti',
  subtitle = 'Diğer taraftarlarla fantezi taktiklerini ve maç yorumlarını paylaşın.',
  placeholder = 'Fantezi taktiğini veya maç yorumunu yaz...',
  emptyNotice = 'Henüz bu alanda bir yorum yok. İlk taktiği veya yorumu sen paylaş!',
  className = '',
}) => {
  const { currentUser, login, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time chat updates
  useEffect(() => {
    const unsubscribe = subscribeToChat(topicId, (newMessages) => {
      setMessages(newMessages);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [topicId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser || !inputText.trim() || isSending) return;

    try {
      setIsSending(true);
      const textToSend = inputText.trim();
      setInputText('');
      await sendChatMessage(topicId, textToSend, currentUser);
    } catch (err) {
      console.error('Mesaj gönderilemedi:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await login();
    } catch (err) {
      console.error('Giriş başarısız:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const formatTime = (date: Date) => {
    try {
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className={`card-sofa flex flex-col h-[520px] max-h-[75vh] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-lg ${className}`}>
      {/* Chat Header */}
      <div className="p-3 sm:p-3.5 border-b border-[var(--border)] bg-[var(--bg-surface-elevated)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-brand)]/15 text-[var(--color-brand)] flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <span>{title}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Canlı Akış" />
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1">{subtitle}</p>
          </div>
        </div>
        <div className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)]">
          {messages.length} Mesaj
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar bg-[var(--bg-app)]/40">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-[var(--color-brand)]" />
            </div>
            <p className="text-xs max-w-xs leading-relaxed font-medium">{emptyNotice}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = currentUser?.uid === msg.userId;
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 max-w-[85%] ${
                  isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* User Avatar */}
                {msg.userPhoto ? (
                  <img
                    src={msg.userPhoto}
                    alt={msg.userName}
                    className="w-7 h-7 rounded-full object-cover border border-[var(--border)] flex-shrink-0 mt-0.5"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-muted)] flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                    {msg.userName ? msg.userName.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed break-words shadow-sm ${
                    isMe
                      ? 'bg-[var(--color-brand)] text-[#0c1017] font-medium rounded-tr-xs'
                      : 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border)] rounded-tl-xs'
                  }`}
                >
                  <div className={`flex items-center gap-1.5 mb-1 text-[10px] ${isMe ? 'text-black/70' : 'text-[var(--text-muted)]'}`}>
                    <span className="font-bold truncate max-w-[120px]">{msg.userName}</span>
                    <span>·</span>
                    <span className="font-mono">{formatTime(msg.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area / Auth Wall */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-surface)]">
        {isAuthenticated ? (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={placeholder}
              maxLength={350}
              disabled={isSending}
              className="flex-1 bg-[var(--bg-app)] border border-[var(--border)] focus:border-[var(--color-brand)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="btn-sofa btn-sofa-primary px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gönder</span>
            </button>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-2 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border)]">
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Sohbete katılmak ve taktik paylaşmak için giriş yapın.</span>
            </div>
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="btn-sofa btn-sofa-primary bg-white text-slate-900 hover:bg-slate-100 flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer w-full sm:w-auto justify-center"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isLoggingIn ? 'Bağlanıyor...' : 'Google ile Giriş Yap'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
