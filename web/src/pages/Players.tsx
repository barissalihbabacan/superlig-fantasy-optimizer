import React, { useState, useMemo } from 'react';
import { SeasonDataset, Player } from '../types';
import { formatPrice, getPositionBadgeColor, getShortPosition, getTeamBranding } from '../services/dataset';
import {
  Search,
  Users,
  ArrowUpDown,
  X,
} from 'lucide-react';

interface PlayersProps {
  dataset: SeasonDataset;
}

type SortField = 'name' | 'price' | 'position' | 'team' | 'points';
type SortOrder = 'asc' | 'desc';

export const Players: React.FC<PlayersProps> = ({ dataset }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [minPrice] = useState<number>(400);
  const [maxPrice, setMaxPrice] = useState<number>(1500);

  const [sortField, setSortField] = useState<SortField>('price');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const teamMap = useMemo(() => {
    const map = new Map<string, string>();
    dataset.teams.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [dataset.teams]);

  const filteredPlayers = useMemo(() => {
    return dataset.players
      .filter((p) => {
        if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        if (selectedTeam !== 'all' && p.team_id !== selectedTeam) {
          return false;
        }
        if (selectedPosition !== 'all' && p.position !== selectedPosition) {
          return false;
        }
        if (p.price < minPrice || p.price > maxPrice) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA: string | number = a[sortField as keyof Player] as string | number;
        let valB: string | number = b[sortField as keyof Player] as string | number;

        if (sortField === 'team') {
          valA = teamMap.get(a.team_id) || '';
          valB = teamMap.get(b.team_id) || '';
        } else if (sortField === 'points') {
          valA = dataset.projections.get(a.id)?.expected_points ?? 0;
          valB = dataset.projections.get(b.id)?.expected_points ?? 0;
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortOrder === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        const numA = typeof valA === 'number' ? valA : 0;
        const numB = typeof valB === 'number' ? valB : 0;
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      });
  }, [dataset.players, dataset.projections, searchTerm, selectedTeam, selectedPosition, minPrice, maxPrice, sortField, sortOrder, teamMap]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const upcomingPlayerFixtures = useMemo(() => {
    if (!selectedPlayer) return [];
    return dataset.fixtures
      .filter((f) => f.home_team_id === selectedPlayer.team_id || f.away_team_id === selectedPlayer.team_id)
      .slice(0, 3);
  }, [selectedPlayer, dataset.fixtures]);

  return (
    <div id="players-page-container" className="space-y-4 animate-fadeIn">
      {/* Top Header */}
      <div id="players-header-bar" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--color-brand)]" />
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Oyuncu Veritabanı & İstatistikler
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            443 Süper Lig oyuncusunun mevkileri, fiyatları ve sezon puanları.
          </p>
        </div>

        <div id="players-count-indicator" className="text-xs font-mono text-[var(--text-muted)] self-start sm:self-auto">
          Gösterilen: <span className="font-bold text-[var(--text-primary)]">{filteredPlayers.length}</span> / {dataset.players.length}
        </div>
      </div>

      {/* Filter Bar */}
      <div id="players-filter-card" className="sofa-card p-3 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {/* Search */}
          <div className="sofa-search-container">
            <Search />
            <input
              id="player-search-input"
              type="text"
              placeholder="Oyuncu ara (Osimhen, Sané...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input-sofa"
            />
          </div>

          {/* Team Select */}
          <div>
            <select
              id="player-team-filter-select"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="form-select-sofa"
            >
              <option value="all">Tüm Kulüpler (18 Takım)</option>
              {dataset.teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Position Select */}
          <div>
            <select
              id="player-position-filter-select"
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="form-select-sofa"
            >
              <option value="all">Tüm Mevkiler (KL, DEF, OS, FOR)</option>
              <option value="Goalkeeper">Kaleci (KL)</option>
              <option value="Defender">Defans (DEF)</option>
              <option value="Midfielder">Orta Saha (OS)</option>
              <option value="Forward">Forvet (FOR)</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[var(--text-muted)] whitespace-nowrap">
              Maks:
            </span>
            <input
              id="player-price-range-slider"
              type="range"
              min={400}
              max={1500}
              step={50}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[var(--color-brand)] cursor-pointer"
            />
            <span id="player-price-max-display" className="text-xs font-mono font-bold text-[var(--color-brand)] whitespace-nowrap">
              {formatPrice(maxPrice)}
            </span>
          </div>
        </div>

        {/* Position Filter Chips */}
        <div id="player-position-quick-chips" className="flex items-center gap-1.5 pt-1 border-t border-[var(--border)]">
          <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] mr-1">Hızlı Filtre:</span>
          {['all', 'Goalkeeper', 'Defender', 'Midfielder', 'Forward'].map((pos) => (
            <button
              key={pos}
              id={`quick-position-btn-${pos}`}
              onClick={() => setSelectedPosition(pos)}
              className={`px-2.5 py-0.5 rounded text-xs font-bold transition-all ${
                selectedPosition === pos
                  ? 'bg-[var(--color-brand)] text-black'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)]'
              }`}
            >
              {pos === 'all' ? 'Tümü' : pos === 'Goalkeeper' ? 'KL' : pos === 'Defender' ? 'DEF' : pos === 'Midfielder' ? 'OS' : 'FOR'}
            </button>
          ))}
        </div>
      </div>

      {/* Players Data Table (Sofascore Stats Table) */}
      <div id="players-table-wrapper" className="sofa-table-wrapper">
        <table id="players-stats-table" className="sofa-table">
          <thead>
            <tr>
              <th id="th-sort-position" onClick={() => handleSort('position')} className="cursor-pointer hover:text-white">
                <div className="flex items-center gap-1">
                  <span>Mevki</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th id="th-sort-name" onClick={() => handleSort('name')} className="cursor-pointer hover:text-white">
                <div className="flex items-center gap-1">
                  <span>Oyuncu</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th id="th-sort-team" onClick={() => handleSort('team')} className="cursor-pointer hover:text-white">
                <div className="flex items-center gap-1">
                  <span>Kulüp</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th id="th-sort-price" onClick={() => handleSort('price')} className="cursor-pointer hover:text-white">
                <div className="flex items-center gap-1">
                  <span>Fiyat</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th id="th-sort-points" onClick={() => handleSort('points')} className="cursor-pointer hover:text-white text-right">
                <div className="flex items-center justify-end gap-1">
                  <span>Sezon Puanı</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map((player) => {
              const brand = getTeamBranding(player.team_id);
              const teamName = teamMap.get(player.team_id) || player.team_id;
              const expectedPoints = dataset.projections.get(player.id)?.expected_points ?? 0;
              const shortPos = getShortPosition(player.position);
              const posColor = getPositionBadgeColor(player.position);

              return (
                <tr
                  key={player.id}
                  id={`player-row-${player.id}`}
                  onClick={() => setSelectedPlayer(player)}
                  className="cursor-pointer"
                >
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
                  <td>
                    <span className="flex items-center gap-1.5 font-medium text-xs">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: brand.primaryColor }}
                      />
                      <span className="truncate max-w-[140px]">{teamName}</span>
                    </span>
                  </td>
                  <td className="font-mono font-bold text-[var(--color-brand)]">
                    {formatPrice(player.price)}
                  </td>
                  <td className="text-right">
                    {expectedPoints > 0 ? (
                      <span className="sofa-rating sofa-rating-high font-mono">
                        {expectedPoints.toFixed(0)} pts
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-[var(--text-muted)] opacity-60">
                        0.0 pts
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Player Detail Drawer Modal */}
      {selectedPlayer && (
        <div id="player-detail-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div
            id="player-detail-modal"
            className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl w-full max-w-md overflow-hidden shadow-2xl space-y-4 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm shadow border"
                  style={{
                    background: getTeamBranding(selectedPlayer.team_id).primaryColor,
                    color: getTeamBranding(selectedPlayer.team_id).textColor,
                  }}
                >
                  {getTeamBranding(selectedPlayer.team_id).code}
                </div>
                <div>
                  <h3 id="player-modal-name" className="font-extrabold text-base text-[var(--text-primary)]">
                    {selectedPlayer.name}
                  </h3>
                  <div className="text-xs text-[var(--text-muted)] font-mono">
                    {teamMap.get(selectedPlayer.team_id)} · {getShortPosition(selectedPlayer.position)}
                  </div>
                </div>
              </div>
              <button
                id="player-modal-close-btn"
                onClick={() => setSelectedPlayer(null)}
                className="p-1 rounded hover:bg-[var(--bg-card)] text-[var(--text-secondary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-[var(--bg-card)] border border-[var(--border)]">
                <div className="text-[10px] text-[var(--text-muted)] uppercase">Kadro Değeri</div>
                <div id="player-modal-price" className="font-black text-sm text-[var(--color-brand)]">
                  {formatPrice(selectedPlayer.price)}
                </div>
              </div>

              <div className="p-2.5 rounded bg-[var(--bg-card)] border border-[var(--border)]">
                <div className="text-[10px] text-[var(--text-muted)] uppercase">Sezon Puanı</div>
                <div id="player-modal-expected-pts" className="font-black text-sm text-[var(--text-primary)]">
                  {dataset.projections.get(selectedPlayer.id)?.expected_points.toFixed(1) ?? '0.0'} pts
                </div>
              </div>
            </div>

            {/* Upcoming Fixtures */}
            <div id="player-modal-fixtures" className="space-y-2">
              <div className="text-[11px] font-bold uppercase text-[var(--text-muted)]">
                Sıradaki Karşılaşmalar
              </div>
              <div className="space-y-1">
                {upcomingPlayerFixtures.map((f) => {
                  const isHome = f.home_team_id === selectedPlayer.team_id;
                  const oppId = isHome ? f.away_team_id : f.home_team_id;
                  const oppName = teamMap.get(oppId) || oppId;

                  return (
                    <div
                      key={f.id}
                      className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-between text-xs"
                    >
                      <span className="font-mono text-[var(--text-muted)]">H{f.round}</span>
                      <span className="font-bold text-[var(--text-primary)]">
                        {isHome ? 'Ev Sahibi vs' : 'Deplasman vs'} {oppName}
                      </span>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">
                        {f.status === 'finished' ? 'Bitti' : 'Planlandı'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                id="player-modal-bottom-close-btn"
                onClick={() => setSelectedPlayer(null)}
                className="btn-sofa btn-sofa-secondary text-xs w-full"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
