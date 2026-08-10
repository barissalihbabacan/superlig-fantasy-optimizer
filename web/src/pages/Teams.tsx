import React, { useState, useMemo } from 'react';
import { SeasonDataset, Team } from '../types';
import { formatPrice, getPositionBadgeColor, translatePosition } from '../services/dataset';
import { Shield, ChevronRight, ArrowLeft } from 'lucide-react';

interface TeamsProps {
  dataset: SeasonDataset;
}

export const Teams: React.FC<TeamsProps> = ({ dataset }) => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [positionFilter, setPositionFilter] = useState<string>('all');

  // Compute team statistics
  const teamStats = useMemo(() => {
    return dataset.teams.map((team) => {
      const teamPlayers = dataset.players.filter((p) => p.team_id === team.id);
      const gk = teamPlayers.filter((p) => p.position === 'Goalkeeper').length;
      const def = teamPlayers.filter((p) => p.position === 'Defender').length;
      const mid = teamPlayers.filter((p) => p.position === 'Midfielder').length;
      const fwd = teamPlayers.filter((p) => p.position === 'Forward').length;
      const avgPrice = teamPlayers.length > 0
        ? teamPlayers.reduce((acc, p) => acc + p.price, 0) / teamPlayers.length
        : 0;

      return {
        team,
        totalPlayers: teamPlayers.length,
        gk,
        def,
        mid,
        fwd,
        avgPrice,
      };
    });
  }, [dataset.teams, dataset.players]);

  // Selected Team's players
  const selectedTeamPlayers = useMemo(() => {
    if (!selectedTeam) return [];
    return dataset.players
      .filter((p) => p.team_id === selectedTeam.id)
      .filter((p) => positionFilter === 'all' || p.position === positionFilter)
      .sort((a, b) => b.price - a.price);
  }, [selectedTeam, dataset.players, positionFilter]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            <span>Süper Lig Kulüpleri (18 Takım)</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            2026/27 sezonu Süper Lig takımları ve kadro derinliği istatistikleri
          </p>
        </div>

        {selectedTeam && (
          <button
            onClick={() => setSelectedTeam(null)}
            className="btn btn-secondary text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tüm Takımlara Dön</span>
          </button>
        )}
      </div>

      {/* Team Detail View */}
      {selectedTeam ? (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-panel p-6 border-l-4 border-l-blue-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Kulüp Detayı</div>
              <h3 className="text-3xl font-extrabold text-[var(--text-primary)] mt-1">{selectedTeam.name}</h3>
              <p className="text-xs text-[var(--text-muted)] font-mono mt-1">ID: {selectedTeam.id}</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="form-select text-xs"
              >
                <option value="all">Tüm Mevkiler ({selectedTeamPlayers.length})</option>
                <option value="Goalkeeper">Kaleci (GK)</option>
                <option value="Defender">Defans (DEF)</option>
                <option value="Midfielder">Orta Saha (MID)</option>
                <option value="Forward">Forvet (FWD)</option>
              </select>
            </div>
          </div>

          {/* Roster Table */}
          <div className="custom-table-container glass-panel">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Oyuncu Adı</th>
                  <th>Pozisyon</th>
                  <th>Fiyat</th>
                  <th>Expected Points</th>
                  <th>Projection</th>
                </tr>
              </thead>
              <tbody>
                {selectedTeamPlayers.map((player) => {
                  const proj = dataset.projections.get(player.id);
                  const expPoints = proj ? proj.expected_points : 0;
                  const posBadge = getPositionBadgeColor(player.position);

                  return (
                    <tr key={player.id}>
                      <td className="font-semibold text-[var(--text-primary)]">{player.name}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: posBadge.bg,
                            color: posBadge.text,
                            borderColor: posBadge.border,
                          }}
                        >
                          {translatePosition(player.position)}
                        </span>
                      </td>
                      <td className="font-mono font-bold text-[var(--text-primary)]">{formatPrice(player.price)}</td>
                      <td className="font-mono font-semibold text-emerald-400">{expPoints.toFixed(1)}</td>
                      <td>
                        {proj ? (
                          <span className="badge bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            Aktif ({expPoints.toFixed(1)})
                          </span>
                        ) : (
                          <span className="badge bg-slate-500/10 text-slate-400 border-slate-500/20">
                            Projection yok
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Team Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamStats.map((item) => (
            <div
              key={item.team.id}
              onClick={() => setSelectedTeam(item.team)}
              className="glass-panel p-5 cursor-pointer hover:border-blue-500/50 hover:scale-[1.01] transition-all group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                    {item.team.name.charAt(0)}
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:translate-x-1 group-hover:text-blue-400 transition-all" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">
                  {item.team.name}
                </h3>
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--border-color)] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Kadro Büyüklüğü:</span>
                  <span className="font-bold text-[var(--text-primary)] font-mono">{item.totalPlayers} Oyuncu</span>
                </div>

                {/* Pos counts grid */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-semibold">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    GK: {item.gk}
                  </div>
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    DEF: {item.def}
                  </div>
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    MID: {item.mid}
                  </div>
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    FWD: {item.fwd}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span>Ort. Oyuncu Fiyatı:</span>
                  <span className="font-mono text-[var(--text-secondary)]">{formatPrice(item.avgPrice)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
