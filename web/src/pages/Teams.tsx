import React, { useState, useMemo } from 'react';
import { SeasonDataset, Team } from '../types';
import { formatPrice, getPositionBadgeColor, getShortPosition, getTeamBranding } from '../services/dataset';
import { Shield, ChevronRight, ArrowLeft, MapPin } from 'lucide-react';

interface TeamsProps {
  dataset: SeasonDataset;
}

export const Teams: React.FC<TeamsProps> = ({ dataset }) => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [positionFilter, setPositionFilter] = useState<string>('all');

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

  const selectedTeamPlayers = useMemo(() => {
    if (!selectedTeam) return [];
    return dataset.players
      .filter((p) => p.team_id === selectedTeam.id)
      .filter((p) => positionFilter === 'all' || p.position === positionFilter)
      .sort((a, b) => b.price - a.price);
  }, [selectedTeam, dataset.players, positionFilter]);

  return (
    <div id="teams-page-container" className="space-y-4 animate-fadeIn">
      {/* Top Header */}
      <div id="teams-header-bar" className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--color-brand)]" />
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Süper Lig Kulüpleri
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            2026/27 sezonunda mücadele eden 18 Süper Lig kulübünün kadro derinliği ve değerleri.
          </p>
        </div>

        {selectedTeam && (
          <button
            id="teams-back-to-all-btn"
            onClick={() => setSelectedTeam(null)}
            className="btn-sofa btn-sofa-secondary text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tüm Kulüpler</span>
          </button>
        )}
      </div>

      {/* View 1: Team Roster View */}
      {selectedTeam ? (
        <div id="team-roster-view" className="space-y-4">
          {/* Team Profile Header Card */}
          {(() => {
            const brand = getTeamBranding(selectedTeam.id);
            const stats = teamStats.find((s) => s.team.id === selectedTeam.id);

            return (
              <div id="team-profile-header-card" className="sofa-card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center font-black text-base shadow border-2"
                      style={{
                        background: brand.primaryColor,
                        color: brand.textColor,
                        borderColor: brand.secondaryColor,
                      }}
                    >
                      {brand.code}
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-[var(--text-primary)]">
                        {selectedTeam.name}
                      </h3>
                      <div className="text-xs text-[var(--text-muted)] flex items-center gap-2 mt-0.5 font-mono">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[var(--color-brand)]" />
                          {brand.stadium} · {brand.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  {stats && (
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border)] text-center">
                        <div className="text-[10px] text-[var(--text-muted)] uppercase">Kadro</div>
                        <div className="font-bold text-[var(--text-primary)]">{stats.totalPlayers} Oyuncu</div>
                      </div>
                      <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border)] text-center">
                        <div className="text-[10px] text-[var(--text-muted)] uppercase">Ortalama Fiyat</div>
                        <div className="font-bold text-[var(--color-brand)]">{formatPrice(stats.avgPrice)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Position Filter Tabs */}
          <div id="team-position-filters" className="flex items-center gap-1.5 overflow-x-auto">
            {['all', 'Goalkeeper', 'Defender', 'Midfielder', 'Forward'].map((pos) => (
              <button
                key={pos}
                id={`team-pos-filter-${pos}`}
                onClick={() => setPositionFilter(pos)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  positionFilter === pos
                    ? 'bg-[var(--color-brand)] text-black'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)]'
                }`}
              >
                {pos === 'all' ? 'Tüm Mevkiler' : pos === 'Goalkeeper' ? 'Kaleci' : pos === 'Defender' ? 'Defans' : pos === 'Midfielder' ? 'Orta Saha' : 'Forvet'}
              </button>
            ))}
          </div>

          {/* Players Table */}
          <div id="team-roster-table-wrapper" className="sofa-table-wrapper">
            <table id="team-roster-table" className="sofa-table">
              <thead>
                <tr>
                  <th>Mevki</th>
                  <th>Oyuncu Adı</th>
                  <th>Fiyat</th>
                  <th className="text-right">Sezon Puanı</th>
                </tr>
              </thead>
              <tbody>
                {selectedTeamPlayers.map((player) => {
                  const shortPos = getShortPosition(player.position);
                  const posColor = getPositionBadgeColor(player.position);
                  const pts = dataset.projections.get(player.id)?.expected_points ?? 0;

                  return (
                    <tr key={player.id} id={`team-roster-row-${player.id}`}>
                      <td>
                        <span
                          className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: posColor.bg, color: posColor.text, border: `1px solid ${posColor.border}` }}
                        >
                          {shortPos}
                        </span>
                      </td>
                      <td className="font-bold text-[var(--text-primary)]">
                        {player.name}
                      </td>
                      <td className="font-mono font-bold text-[var(--color-brand)]">
                        {formatPrice(player.price)}
                      </td>
                      <td className="text-right">
                        {pts > 0 ? (
                          <span className="sofa-rating sofa-rating-high font-mono">
                            {pts.toFixed(0)} pts
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-[var(--text-muted)] opacity-60">0.0 pts</span>
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
        /* View 2: All Teams Grid (Sofascore Style Club Cards) */
        <div id="all-teams-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {teamStats.map(({ team, totalPlayers, gk, def, mid, fwd, avgPrice }) => {
            const brand = getTeamBranding(team.id);

            return (
              <div
                key={team.id}
                id={`team-card-${team.id}`}
                onClick={() => setSelectedTeam(team)}
                className="sofa-card p-4 hover:bg-[var(--bg-card-hover)] cursor-pointer transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shadow border flex-shrink-0"
                      style={{
                        background: brand.primaryColor,
                        color: brand.textColor,
                        borderColor: brand.secondaryColor,
                      }}
                    >
                      {brand.code}
                    </div>
                    <div className="truncate">
                      <h4 className="font-extrabold text-sm text-[var(--text-primary)] truncate">
                        {team.name}
                      </h4>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono truncate">
                        {brand.stadium}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                </div>

                <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px] pt-2 border-t border-[var(--border)]">
                  <div className="p-1 rounded bg-[var(--bg-surface)]">
                    <div className="text-[var(--text-muted)]">KL</div>
                    <div className="font-bold text-[var(--text-primary)]">{gk}</div>
                  </div>
                  <div className="p-1 rounded bg-[var(--bg-surface)]">
                    <div className="text-[var(--text-muted)]">DEF</div>
                    <div className="font-bold text-[var(--text-primary)]">{def}</div>
                  </div>
                  <div className="p-1 rounded bg-[var(--bg-surface)]">
                    <div className="text-[var(--text-muted)]">OS</div>
                    <div className="font-bold text-[var(--text-primary)]">{mid}</div>
                  </div>
                  <div className="p-1 rounded bg-[var(--bg-surface)]">
                    <div className="text-[var(--text-muted)]">FOR</div>
                    <div className="font-bold text-[var(--text-primary)]">{fwd}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] pt-1">
                  <span>Toplam {totalPlayers} Oyuncu</span>
                  <span className="text-[var(--color-brand)] font-bold">Ort: {formatPrice(avgPrice)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
