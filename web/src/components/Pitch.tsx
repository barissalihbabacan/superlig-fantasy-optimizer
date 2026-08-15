import React from 'react';
import { Player, FormationType } from '../types';
import { formatPrice, getTeamBranding } from '../services/dataset';

interface PitchProps {
  formation: FormationType;
  lineup?: Player[];
  bench?: Player[];
  captainId?: number | string;
  viceCaptainId?: number | string;
  onPlayerClick?: (player: Player) => void;
}

export const Pitch: React.FC<PitchProps> = ({
  formation = '3-5-2',
  lineup,
  bench,
  captainId,
  viceCaptainId,
  onPlayerClick,
}) => {
  const parseFormation = (fmt: FormationType) => {
    if (fmt === 'Auto') return { def: 3, mid: 5, fwd: 2 };
    const parts = fmt.split('-').map(Number);
    return { def: parts[0] || 4, mid: parts[1] || 4, fwd: parts[2] || 2 };
  };

  const counts = parseFormation(formation);

  const gkList = lineup ? lineup.filter((p) => p.position === 'Goalkeeper') : [];
  const defList = lineup ? lineup.filter((p) => p.position === 'Defender') : [];
  const midList = lineup ? lineup.filter((p) => p.position === 'Midfielder') : [];
  const fwdList = lineup ? lineup.filter((p) => p.position === 'Forward') : [];

  const renderPlayerToken = (posLabel: string, player?: Player, index: number = 0) => {
    const isCaptain = player && String(player.id) === String(captainId);
    const isViceCaptain = player && String(player.id) === String(viceCaptainId);
    const brand = player ? getTeamBranding(player.team_id) : null;

    return (
      <div
        key={`${posLabel}-${index}`}
        onClick={() => player && onPlayerClick && onPlayerClick(player)}
        className="player-token"
      >
        <div
          className="player-jersey-circle"
          style={{
            background: brand ? brand.primaryColor : 'rgba(15, 23, 42, 0.9)',
            color: brand ? brand.textColor : '#fff',
            borderColor: isCaptain ? '#f59e0b' : brand ? brand.secondaryColor : 'rgba(255,255,255,0.4)',
          }}
        >
          {isCaptain && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center shadow">
              C
            </span>
          )}
          {isViceCaptain && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-200 text-black text-[9px] font-black flex items-center justify-center shadow">
              V
            </span>
          )}
          <span>{player ? brand?.code : posLabel}</span>
        </div>

        <div className="player-token-name">
          {player ? player.name.split(' ').slice(-1)[0] : `${posLabel} ${index + 1}`}
        </div>

        <div className="player-token-price">
          {player ? formatPrice(player.price) : posLabel}
        </div>
      </div>
    );
  };

  return (
    <div id="pitch-container" className="h-full flex flex-col space-y-3">
      {/* Tactical Football Pitch */}
      <div id="pitch-field" className="pitch-field flex-1">
        <div className="pitch-line-half" />
        <div className="pitch-center-spot" />
        <div className="pitch-box-top" />
        <div className="pitch-box-bottom" />

        {/* Forwards (Top) */}
        <div className="pitch-row-players">
          {Array.from({ length: counts.fwd }).map((_, i) =>
            renderPlayerToken('FOR', fwdList[i], i)
          )}
        </div>

        {/* Midfielders */}
        <div className="pitch-row-players">
          {Array.from({ length: counts.mid }).map((_, i) =>
            renderPlayerToken('OS', midList[i], i)
          )}
        </div>

        {/* Defenders */}
        <div className="pitch-row-players">
          {Array.from({ length: counts.def }).map((_, i) =>
            renderPlayerToken('DEF', defList[i], i)
          )}
        </div>

        {/* Goalkeeper (Bottom) */}
        <div className="pitch-row-players">
          {renderPlayerToken('KL', gkList[0], 0)}
        </div>
      </div>

      {/* Dugout / Bench Section (Sofascore Style) */}
      {bench && bench.length > 0 && (
        <div className="sofa-card p-3">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center justify-between">
            <span>Yedek Kulübesi (4 Oyuncu)</span>
            <span>Bütçeye Dahil</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {bench.map((player) => {
              const brand = getTeamBranding(player.team_id);
              return (
                <div
                  key={player.id}
                  onClick={() => onPlayerClick && onPlayerClick(player)}
                  className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border)] flex flex-col items-center text-center hover:bg-[var(--bg-card-hover)] cursor-pointer transition-colors"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] border shadow-sm"
                    style={{
                      background: brand.primaryColor,
                      color: brand.textColor,
                      borderColor: brand.secondaryColor,
                    }}
                  >
                    {brand.code}
                  </div>
                  <span className="font-bold text-[11px] text-[var(--text-primary)] truncate max-w-full mt-1">
                    {player.name.split(' ').slice(-1)[0]}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-brand)]">
                    {formatPrice(player.price)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
