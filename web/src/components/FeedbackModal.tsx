import React, { useState } from 'react';
import { X, Lightbulb, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { submitFeatureSuggestion } from '../services/firebase';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !suggestion.trim()) {
      setErrorMessage('Lütfen konu başlığı ve öneri alanlarını doldurun.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await submitFeatureSuggestion({
        title: title.trim(),
        suggestion: suggestion.trim(),
        contact: contact.trim() || undefined,
      });

      setIsSuccess(true);
      setTitle('');
      setSuggestion('');
      setContact('');
    } catch (err: unknown) {
      console.error('Öneri kaydedilirken hata oluştu:', err);
      setErrorMessage('Öneri kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setIsSuccess(false);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div
      id="feedback-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={handleModalClose}
    >
      <div
        id="feedback-modal-card"
        className="glass-panel w-full max-w-lg p-4 sm:p-6 space-y-4 relative border border-[var(--border)] shadow-2xl rounded-2xl bg-[var(--bg-surface)] text-[var(--text-primary)] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">
                Bir Fikrin mi Var?
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Süper Lig Fantasy Optimizer için yeni özellik ve geliştirme önerisi gönder
              </p>
            </div>
          </div>

          <button
            id="feedback-modal-close-btn"
            onClick={handleModalClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          /* Success Screen */
          <div className="py-6 text-center space-y-3 animate-fadeIn">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[var(--text-primary)]">
              Önerin Başarıyla İletildi! 🎉
            </h4>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
              Fikirlerin projenin gelişimi için çok değerli. Geliştirme listesine eklendi ve değerlendirilecek.
            </p>
            <div className="pt-2">
              <button
                onClick={handleModalClose}
                className="btn-sofa btn-sofa-primary text-xs px-6 py-2"
              >
                Harika, Kapat
              </button>
            </div>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs animate-fadeIn">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Title / Topic */}
            <div className="space-y-1">
              <label htmlFor="feedback-title" className="block text-xs font-semibold text-[var(--text-primary)]">
                Öneri Konusu / Başlık <span className="text-rose-400">*</span>
              </label>
              <input
                id="feedback-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Oyuncu listesine xG ve form grafiği filtresi"
                maxLength={150}
                required
                className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg-card)] border border-[var(--border)] focus:border-amber-400 focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)]"
              />
            </div>

            {/* Detailed Suggestion */}
            <div className="space-y-1">
              <label htmlFor="feedback-suggestion" className="block text-xs font-semibold text-[var(--text-primary)]">
                Öneriniz & Çözmesini İstediğiniz Problem <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="feedback-suggestion"
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="Eklenmesini istediğin özellik nedir, nasıl çalışmalı ve hangi problemi kolaylaştırmasını istersin?"
                rows={4}
                maxLength={2000}
                required
                className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg-card)] border border-[var(--border)] focus:border-amber-400 focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-y min-h-[90px]"
              />
            </div>

            {/* Contact (Optional) */}
            <div className="space-y-1">
              <label htmlFor="feedback-contact" className="block text-xs font-semibold text-[var(--text-secondary)]">
                E-posta veya Rumuz <span className="text-[10px] text-[var(--text-muted)] font-normal">(İsteğe bağlı)</span>
              </label>
              <input
                id="feedback-contact"
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Geri bildirim için e-posta adresi veya isim"
                maxLength={100}
                className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg-card)] border border-[var(--border)] focus:border-amber-400 focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)]"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-[var(--border)]">
              <span className="text-[11px] text-[var(--text-muted)]">
                Hesap gerekmez · Doğrudan kaydedilir
              </span>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-sofa btn-sofa-primary text-xs px-4 py-2 flex items-center gap-1.5 font-bold shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Öneriyi Gönder</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
