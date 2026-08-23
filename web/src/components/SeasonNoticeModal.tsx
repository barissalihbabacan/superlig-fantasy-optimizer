import React from 'react';
import { SeasonDataset } from '../types';
import { getTeamBranding, getCurrentActiveRound } from '../services/dataset';
import { AlertTriangle, CheckCircle, Calendar, Trophy, Sparkles, X, Clock } from 'lucide-react';

interface SeasonNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset?: SeasonDataset | null;
}

export const SeasonNoticeModal: React.FC<SeasonNoticeModalProps> = ({ isOpen, onClose, dataset }) => {
  if (!isOpen) return null;

  const currentRound = dataset?.fixtures ? getCurrentActiveRound(dataset.fixtures) : 1;
  const currentRoundFixtures = dataset?.fixtures.filter((f) => f.round === currentRound) || [];
  const finishedMatches = currentRoundFixtures.filter((f) => f.status === 'finished' && f.score);
  const remainingMatches = currentRoundFixtures.filter((f) => f.status !== 'finished');

  return (
    <div id="season-notice-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        id="season-notice-modal-card"
        className="glass-panel w-full max-w-lg p-5 sm:p-7 space-y-4 relative border border-amber-500/30 shadow-2xl rounded-3xl bg-[var(--bg-surface)] text-[var(--text-primary)] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Icon Button */}
        <button
          id="season-notice-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-colors"
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-lg">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-semibold border border-amber-500/20 mb-1">
              <Sparkles className="w-3 h-3" />
              <span>{currentRound}. Hafta Maç Takvimi & Canlı Durum</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Kadro Planlama & Canlı Durum
            </h3>
          </div>
        </div>

        {/* Dynamic Finished Matches Feed (If any finished in active round) */}
        {finishedMatches.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)] px-1">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                Tamamlanan Karşılaşmalar ({finishedMatches.length})
              </span>
              <span>Resmi Sonuç</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {finishedMatches.map((f) => {
                const homeName = dataset?.teams.find((t) => t.id === f.home_team_id)?.name || f.home_team_id;
                const awayName = dataset?.teams.find((t) => t.id === f.away_team_id)?.name || f.away_team_id;
                const homeBrand = getTeamBranding(f.home_team_id);
                const awayBrand = getTeamBranding(f.away_team_id);

                return (
                  <div
                    key={f.id}
                    className="grid grid-cols-12 items-center p-2 sm:px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs"
                  >
                    {/* Home Team (5 cols) */}
                    <div className="col-span-5 flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-3.5 rounded-full flex-shrink-0" style={{ background: homeBrand.primaryColor }} />
                      <span className="font-bold text-[var(--text-primary)] truncate">{homeName}</span>
                    </div>

                    {/* Score (2 cols, perfectly centered) */}
                    <div className="col-span-2 flex items-center justify-center">
                      <div className="font-mono font-black text-xs sm:text-sm px-2 py-0.5 rounded bg-[var(--bg-card)] border border-emerald-500/30 text-emerald-300 w-16 text-center">
                        {f.score?.home} - {f.score?.away}
                      </div>
                    </div>

                    {/* Away Team (5 cols) */}
                    <div className="col-span-5 flex items-center gap-2 min-w-0 justify-end text-right">
                      <span className="font-bold text-[var(--text-primary)] truncate">{awayName}</span>
                      <span className="w-1.5 h-3.5 rounded-full flex-shrink-0" style={{ background: awayBrand.primaryColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Message Content */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
          <p className="font-semibold text-amber-300 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>
              2026/27 Sezonu — {currentRound}. Hafta Karşılaşmaları {remainingMatches.length === 0 ? 'Tamamlandı' : 'Devam Ediyor'}
            </span>
          </p>
          <p>
            {finishedMatches.length > 0 ? (
              <>
                Oynanan <span className="text-white font-bold">{finishedMatches.length} karşılaşmanın</span> resmi maç sonuçları ve oyuncu puanları sisteme işlendi.{' '}
                {remainingMatches.length > 0 ? (
                  <>
                    Kalan <span className="text-white font-bold">{remainingMatches.length} karşılaşma</span> tamamlandıkça puan projeksiyonları anlık güncellenecektir.
                  </>
                ) : (
                  <>Haftanın tüm karşılaşmaları tamamlandı.</>
                )}
              </>
            ) : (
              <>
                {currentRound}. hafta karşılaşmaları için fikstür ve oyuncu beklenen puanları hazırlandı. Maçlar oynandıkça sonuçlar otomatik işlenecektir.
              </>
            )}
          </p>
          <p className="font-medium text-amber-100 flex items-center gap-1.5 pt-1">
            <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>Kadro kurucunuz, güncel maç verilerini ve beklenen puanları dikkate alarak optimize edilmektedir.</span>
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-1">
          <button
            id="season-notice-modal-confirm-btn"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Anladım, Kadro Planlamaya Devam Et</span>
          </button>
        </div>
      </div>
    </div>
  );
};
