import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Fixture } from '../types';
import { getTeamBranding } from '../services/dataset';

interface MatchTickerProps {
  fixtures: Fixture[];
  teamsMap?: Map<string, string>;
  selectedRound: number;
  onSelectRound?: (round: number) => void;
  onSelectFixture?: (fixture: Fixture) => void;
}

export const MatchTicker: React.FC<MatchTickerProps> = ({
  fixtures,
  selectedRound,
  onSelectRound,
  onSelectFixture,
}) => {
  const maxRound = 34;
  const currentRoundFixtures = fixtures.filter((f) => f.round === selectedRound);

  // Duplicate items for a perfectly smooth, infinite marquee scroll loop
  const loopFixtures = [...currentRoundFixtures, ...currentRoundFixtures];

  const handlePrevRound = () => {
    if (onSelectRound) {
      onSelectRound(selectedRound > 1 ? selectedRound - 1 : maxRound);
    }
  };

  const handleNextRound = () => {
    if (onSelectRound) {
      onSelectRound(selectedRound < maxRound ? selectedRound + 1 : 1);
    }
  };

  return (
    <div id="match-ticker-container" className="w-full bg-[var(--bg-surface)] border-b border-[var(--border)] overflow-hidden mb-0 shadow-sm">
      <div className="app-container py-2 flex items-center gap-2 sm:gap-3">
        {/* Round Selector Badge with Interactive Prev/Next Controls */}
        <div id="match-ticker-round-badge" className="flex items-center gap-1 flex-shrink-0 pr-2 sm:pr-3 border-r border-[var(--border)] z-10 bg-[var(--bg-surface)]">
          {onSelectRound && (
            <button
              id="match-ticker-prev-round"
              onClick={handlePrevRound}
              className="p-0.5 rounded hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              title="Önceki Hafta"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <span className="w-2 h-2 rounded-full bg-[var(--color-brand)] animate-pulse" />
          <span className="text-[10px] font-mono font-black uppercase text-[var(--color-brand)] bg-[var(--color-brand)]/10 px-2 py-0.5 rounded tracking-wider whitespace-nowrap">
            {selectedRound}. Hafta
          </span>

          {onSelectRound && (
            <button
              id="match-ticker-next-round"
              onClick={handleNextRound}
              className="p-0.5 rounded hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              title="Sonraki Hafta"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Automatic Sliding Marquee Container */}
        <div id="match-ticker-viewport" className="flex-1 overflow-hidden ticker-mask relative py-0.5">
          <div key={`ticker-track-round-${selectedRound}`} id="match-ticker-track" className="ticker-marquee-track">
            {loopFixtures.map((fixture, idx) => {
              const homeBrand = getTeamBranding(fixture.home_team_id);
              const awayBrand = getTeamBranding(fixture.away_team_id);
              const isFinished = fixture.status === 'finished';
              const isLive = fixture.status === 'live';
              const hasScore = fixture.score !== undefined && fixture.score !== null;

              return (
                <button
                  key={`${fixture.id}-${idx}`}
                  id={`ticker-match-${fixture.id}-${idx < currentRoundFixtures.length ? 'primary' : 'clone'}`}
                  onClick={() => onSelectFixture && onSelectFixture(fixture)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded bg-[var(--bg-card)] border transition-colors flex-shrink-0 text-left cursor-pointer select-none ${
                    isLive
                      ? 'border-rose-500/50 bg-rose-500/5 hover:border-rose-500'
                      : 'border-[var(--border)] hover:border-[var(--color-brand)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                  title={`${homeBrand.code} vs ${awayBrand.code} - Maç Detayı`}
                >
                  {/* Home Code & Color Tag */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ background: homeBrand.primaryColor }}
                    />
                    <span className="font-bold text-xs text-[var(--text-primary)] font-mono">
                      {homeBrand.code}
                    </span>
                  </div>

                  {/* Score or VS */}
                  {(isFinished || isLive) && hasScore ? (
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-mono font-black text-xs border ${
                      isLive 
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 animate-pulse'
                        : 'bg-[var(--bg-app)] text-[var(--text-primary)] border-[var(--border)]'
                    }`}>
                      <span>{fixture.score?.home}</span>
                      <span className="text-[var(--text-muted)] font-normal">-</span>
                      <span>{fixture.score?.away}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] px-1">
                      vs
                    </span>
                  )}

                  {/* Away Code & Color Tag */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-[var(--text-primary)] font-mono">
                      {awayBrand.code}
                    </span>
                    <span
                      className="w-1.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ background: awayBrand.primaryColor }}
                    />
                  </div>

                  {/* Status Tag */}
                  {isLive ? (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono border border-rose-500/30 animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      CANLI
                    </span>
                  ) : isFinished ? (
                    <span className="text-[9px] font-extrabold uppercase px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/20">
                      MS
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-[var(--text-muted)] bg-[var(--bg-surface)] px-1 py-0.5 rounded">
                      {fixture.kickoff.includes('T') ? fixture.kickoff.split('T')[1].slice(0, 5) : '—'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
