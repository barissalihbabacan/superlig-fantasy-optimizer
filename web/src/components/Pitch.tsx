import React from 'react';
import { Player, FormationType } from '../types';
import { getShortPosition, formatPrice } from '../services/dataset';
import { Shield, User } from 'lucide-react';

interface PitchProps {
  formation: FormationType;
  lineup?: Player[];
  bench?: Player[];
  captainId?: string;
  viceCaptainId?: string;
}

export const Pitch: React.FC<PitchProps> = ({
  formation = '3-5-2',
  lineup,
  bench,
  captainId,
  viceCaptainId,
}) => {
  // Parse formation defenders, midfielders, forwards
  const parseFormation = (fmt: FormationType) => {
    if (fmt === 'Auto') return { def: 3, mid: 5, fwd: 2 };
    const parts = fmt.split('-').map(Number);
    return { def: parts[0] || 4, mid: parts[1] || 4, fwd: parts[2] || 2 };
  };

  const counts = parseFormation(formation);

  // Group players by position if lineup is provided, else render slot placeholders
  const gkList = lineup ? lineup.filter((p) => p.position === 'Goalkeeper') : [];
  const defList = lineup ? lineup.filter((p) => p.position === 'Defender') : [];
  const midList = lineup ? lineup.filter((p) => p.position === 'Midfielder') : [];
  const fwdList = lineup ? lineup.filter((p) => p.position === 'Forward') : [];

  const renderSlot = (
    posLabel: string,
    player?: Player,
    index: number = 0
  ) => {
    const isCaptain = player && player.id === captainId;
    const isViceCaptain = player && player.id === viceCaptainId;

    return (
      <div
        key={`${posLabel}-${index}`}
        className="pitch-card relative flex flex-col items-center justify-center p-2 rounded-xl transition-all"
      >
        {isCaptain && (
          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center border border-amber-300 shadow">
            C
          </span>
        )}
        {isViceCaptain && (
          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-300 text-black text-[10px] font-bold flex items-center justify-center border border-white shadow">
            VC
          </span>
        )}
        <div className="w-8 h-8 rounded-full bg-slate-800/80 border border-white/20 flex items-center justify-center text-blue-400 mb-1 shadow">
          <User className="w-4 h-4" />
        </div>
        <div className="text-xs font-semibold text-white truncate max-w-[90px]">
          {player ? player.name : `${posLabel} ${index + 1}`}
        </div>
        <div className="text-[10px] text-slate-300 font-mono">
          {player ? formatPrice(player.price) : posLabel}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="pitch-container relative">
        <div className="pitch-line-center" />
        <div className="pitch-circle-center" />
        <div className="pitch-penalty-area-top" />
        <div className="pitch-penalty-area-bottom" />

        {/* Forwards */}
        <div className="pitch-row">
          {Array.from({ length: counts.fwd }).map((_, i) =>
            renderSlot('FWD', fwdList[i], i)
          )}
        </div>

        {/* Midfielders */}
        <div className="pitch-row">
          {Array.from({ length: counts.mid }).map((_, i) =>
            renderSlot('MID', midList[i], i)
          )}
        </div>

        {/* Defenders */}
        <div className="pitch-row">
          {Array.from({ length: counts.def }).map((_, i) =>
            renderSlot('DEF', defList[i], i)
          )}
        </div>

        {/* Goalkeeper */}
        <div className="pitch-row justify-center">
          {renderSlot('GK', gkList[0], 0)}
        </div>
      </div>

      {/* Bench Section */}
      <div className="glass-panel p-4 rounded-2xl border border-[var(--border-color)]">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Yedek Oyuncular (Bench - 4)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {bench && bench.length > 0 ? (
            bench.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center">
                  {getShortPosition(p.position)}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono">
                    {formatPrice(p.price)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              {['GK', 'DEF', 'MID', 'FWD'].map((pos, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] opacity-60"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 font-bold text-xs flex items-center justify-center">
                    {pos}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--text-muted)]">
                      Yedek {idx + 1}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono">
                      Boş Slot
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
