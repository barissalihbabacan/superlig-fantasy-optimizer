import React from 'react';
import { AlertTriangle, CheckCircle, Calendar, Trophy, Sparkles, X } from 'lucide-react';

interface SeasonNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SeasonNoticeModal: React.FC<SeasonNoticeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div 
        className="glass-panel w-full max-w-lg p-6 sm:p-8 space-y-6 relative border border-amber-500/30 shadow-2xl rounded-3xl bg-[var(--bg-surface)] text-[var(--text-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Icon Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-colors"
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-lg">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sezon Bilgilendirmesi</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Kadro Planlama Uyarısı
            </h3>
          </div>
        </div>

        {/* Played match highlight */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-green-400">
            <Trophy className="w-4 h-4 flex-shrink-0" />
            <span className="font-semibold">Galatasaray</span>
          </div>
          <div className="font-bold text-white text-base">2 – 2</div>
          <div className="flex items-center gap-2 text-green-400 flex-row-reverse">
            <Trophy className="w-4 h-4 flex-shrink-0 opacity-0" />
            <span className="font-semibold">Çorum FK</span>
          </div>
        </div>

        {/* Message Content */}
        <div className="space-y-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-amber-200/90 leading-relaxed">
          <p className="font-semibold text-amber-300 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>2026/27 Sezonu — 1. Hafta Devam Ediyor</span>
          </p>
          <p>
            <span className="text-white font-medium">Galatasaray – Çorum FK</span> maç verisi (14 Ağu 2026) sisteme işlendi.
            1. haftanın kalan sekiz maçının sonuçları henüz eklenmedi.
          </p>
          <p className="font-medium text-amber-100">
            Eksik maç verileri tamamlandıkça puan projeksiyonları güncellenecek ve optimizasyon motoru tam kapasitede çalışacaktır.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Anladım, Kadro Planlamaya Devam Et</span>
          </button>
        </div>
      </div>
    </div>
  );
};
