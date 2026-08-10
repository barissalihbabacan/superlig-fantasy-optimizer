import React, { useState, useMemo } from 'react';
import { SeasonDataset, Player } from '../types';
import { formatPrice, getPositionBadgeColor, translatePosition } from '../services/dataset';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  X, 
  Info, 
  User, 
  Shield, 
  Calendar,
  ChevronRight
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
  const [minPrice, setMinPrice] = useState<number>(400);
  const [maxPrice, setMaxPrice] = useState<number>(1500);

  const [sortField, setSortField] = useState<SortField>('price');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Quick lookup maps
  const teamMap = useMemo(() => {
    const map = new Map<string, string>();
    dataset.teams.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [dataset.teams]);

  // Filter & Sort Players
  const filteredPlayers = useMemo(() => {
    return dataset.players
      .filter((p) => {
        // Name search
        if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        // Team filter
        if (selectedTeam !== 'all' && p.team_id !== selectedTeam) {
          return false;
        }
        // Position filter
        if (selectedPosition !== 'all' && p.position !== selectedPosition) {
          return false;
        }
        // Price filter
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

  // Find upcoming 3 fixtures for selected player's team
  const upcomingPlayerFixtures = useMemo(() => {
    if (!selectedPlayer) return [];
    return dataset.fixtures
      .filter((f) => f.home_team_id === selectedPlayer.team_id || f.away_team_id === selectedPlayer.team_id)
      .slice(0, 3);
  }, [selectedPlayer, dataset.fixtures]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <User className="w-6 h-6 text-blue-500" />
            <span>Oyuncu Veri Bankası</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Toplam {filteredPlayers.length} / {dataset.players.length} oyuncu listeleniyor
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Oyuncu adı ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-9"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-[var(--text-muted)] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Team Dropdown */}
          <div>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="form-select"
            >
              <option value="all">Tüm Takımlar ({dataset.teams.length})</option>
              {dataset.teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Position Dropdown */}
          <div>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="form-select"
            >
              <option value="all">Tüm Pozisyonlar</option>
              <option value="Goalkeeper">Kaleci (GK)</option>
              <option value="Defender">Defans (DEF)</option>
              <option value="Midfielder">Orta Saha (MID)</option>
              <option value="Forward">Forvet (FWD)</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div>
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-') as [SortField, SortOrder];
                setSortField(field);
                setSortOrder(order);
              }}
              className="form-select"
            >
              <option value="price-desc">Fiyat: Yüksekten Düşüğe</option>
              <option value="price-asc">Fiyat: Düşükten Yüksekçe</option>
              <option value="name-asc">İsim: A - Z</option>
              <option value="name-desc">İsim: Z - A</option>
              <option value="points-desc">Expected Points: En Yüksek</option>
            </select>
          </div>
        </div>

        {/* Price Slider */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2 font-medium">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span>Fiyat Aralığı:</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span>{formatPrice(minPrice)}</span>
            <input
              type="range"
              min={400}
              max={1500}
              step={50}
              value={minPrice}
              onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - 50))}
              className="accent-blue-500 cursor-pointer"
            />
            <span>-</span>
            <input
              type="range"
              min={400}
              max={1500}
              step={50}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + 50))}
              className="accent-blue-500 cursor-pointer"
            />
            <span>{formatPrice(maxPrice)}</span>
          </div>

          {(searchTerm || selectedTeam !== 'all' || selectedPosition !== 'all' || minPrice > 400 || maxPrice < 1500) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedTeam('all');
                setSelectedPosition('all');
                setMinPrice(400);
                setMaxPrice(1500);
              }}
              className="text-xs text-blue-400 hover:underline ml-auto"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      </div>

      {/* Players Data Table */}
      <div className="custom-table-container glass-panel">
        <table className="custom-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className="cursor-pointer hover:text-[var(--text-primary)]">
                <div className="flex items-center gap-1.5">
                  <span>Oyuncu</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </div>
              </th>
              <th onClick={() => handleSort('team')} className="cursor-pointer hover:text-[var(--text-primary)]">
                <div className="flex items-center gap-1.5">
                  <span>Takım</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </div>
              </th>
              <th onClick={() => handleSort('position')} className="cursor-pointer hover:text-[var(--text-primary)]">
                <div className="flex items-center gap-1.5">
                  <span>Pozisyon</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </div>
              </th>
              <th onClick={() => handleSort('price')} className="cursor-pointer hover:text-[var(--text-primary)]">
                <div className="flex items-center gap-1.5">
                  <span>Fiyat</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </div>
              </th>
              <th onClick={() => handleSort('points')} className="cursor-pointer hover:text-[var(--text-primary)]">
                <div className="flex items-center gap-1.5">
                  <span>Expected Points</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </div>
              </th>
              <th>Projection Durumu</th>
              <th className="text-right">Detay</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map((player) => {
                const teamName = teamMap.get(player.team_id) || player.team_id;
                const posBadge = getPositionBadgeColor(player.position);
                const proj = dataset.projections.get(player.id);
                const expPoints = proj ? proj.expected_points : 0;

                return (
                  <tr
                    key={player.id}
                    onClick={() => setSelectedPlayer(player)}
                    className="cursor-pointer transition-colors hover:bg-[var(--bg-card-hover)]"
                  >
                    <td className="font-semibold text-[var(--text-primary)]">
                      {player.name}
                    </td>
                    <td className="text-[var(--text-secondary)] font-medium">
                      {teamName}
                    </td>
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
                    <td className="font-mono font-bold text-[var(--text-primary)]">
                      {formatPrice(player.price)}
                    </td>
                    <td className="font-mono font-semibold text-emerald-400">
                      {expPoints.toFixed(1)}
                    </td>
                    <td>
                      {proj ? (
                        <span className="badge bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                          Mevcut ({expPoints.toFixed(1)} pt)
                        </span>
                      ) : (
                        <span className="badge bg-slate-500/10 text-slate-400 border-slate-500/20">
                          Projection yok
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)] inline-block" />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[var(--text-muted)]">
                  Filtrelere uygun oyuncu bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg p-6 space-y-6 relative border border-blue-500/30">
            <button
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className="badge"
                  style={{
                    backgroundColor: getPositionBadgeColor(selectedPlayer.position).bg,
                    color: getPositionBadgeColor(selectedPlayer.position).text,
                    borderColor: getPositionBadgeColor(selectedPlayer.position).border,
                  }}
                >
                  {translatePosition(selectedPlayer.position)}
                </span>
                <span className="text-xs font-semibold text-[var(--text-muted)]">ID: {selectedPlayer.id}</span>
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">{selectedPlayer.name}</h3>
              <div className="text-sm font-medium text-blue-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>{teamMap.get(selectedPlayer.team_id) || selectedPlayer.team_id}</span>
              </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                <div className="text-xs text-[var(--text-muted)]">Fiyat</div>
                <div className="text-xl font-bold text-[var(--text-primary)] font-mono">
                  {formatPrice(selectedPlayer.price)}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                <div className="text-xs text-[var(--text-muted)]">Expected Points</div>
                <div className="text-xl font-bold text-emerald-400 font-mono">
                  {(dataset.projections.get(selectedPlayer.id)?.expected_points ?? 0).toFixed(1)}
                </div>
              </div>
            </div>

            {/* Projection Status Info */}
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-blue-400">
                <Info className="w-4 h-4" />
                <span>Projection Bilgisi</span>
              </div>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {dataset.projections.has(selectedPlayer.id)
                  ? `Historical projection score: ${dataset.projections.get(selectedPlayer.id)?.expected_points}`
                  : 'Projection yok. Sezon öncesi veya veri eşleşmesi bekleniyor.'}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] pt-1 italic">
                * Note: 0 expected points oyuncunun performans kalitesini değil, henüz maç verisi girilmediğini ifade eder.
              </p>
            </div>

            {/* Upcoming Fixtures */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Gelecek Fikstür (Gelecek 3 Maç)</span>
              </div>
              <div className="space-y-2">
                {upcomingPlayerFixtures.length > 0 ? (
                  upcomingPlayerFixtures.map((fix) => {
                    const isHome = fix.home_team_id === selectedPlayer.team_id;
                    const opponentId = isHome ? fix.away_team_id : fix.home_team_id;
                    const opponentName = teamMap.get(opponentId) || opponentId;

                    return (
                      <div
                        key={fix.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs"
                      >
                        <span className="font-semibold text-blue-400">Hafta {fix.round}</span>
                        <span className="font-medium text-[var(--text-primary)]">
                          {isHome ? `vs ${opponentName} (Ev)` : `@ ${opponentName} (Deplasman)`}
                        </span>
                        <span className="text-[var(--text-muted)] font-mono">{fix.status}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-[var(--text-muted)] italic">Fikstür bilgisi bulunamadı.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
