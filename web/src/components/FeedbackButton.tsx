import React from 'react';
import { Lightbulb } from 'lucide-react';

interface FeedbackButtonProps {
  onClick: () => void;
}

export const FeedbackButton: React.FC<FeedbackButtonProps> = ({ onClick }) => {
  return (
    <aside
      id="feedback-floating-container"
      aria-label="Geliştirme önerisi alanı"
      className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-40"
    >
      <button
        id="feedback-floating-btn"
        onClick={onClick}
        type="button"
        className="group inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-[var(--bg-surface)]/95 hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:border-amber-400/40 shadow-md hover:shadow-lg backdrop-blur-md transition-all duration-200 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
        title="Süper Lig Fantasy Optimizer için fikir veya geliştirme önerisi gönder"
        aria-label="Bir fikrin mi var? Geliştirme önerisi penceresini aç"
      >
        <Lightbulb className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline">Bir fikrin mi var?</span>
        <span className="inline sm:hidden">Fikir Paylaş</span>
      </button>
    </aside>
  );
};
