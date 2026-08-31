import React, { useState, useMemo, useEffect } from 'react';
import { SeasonDataset, Player } from '../types';
import { formatPrice, getPositionBadgeColor, getShortPosition, getTeamBranding } from '../services/dataset';
import {
  calculateRealizedPlayerStats,
  getMatchDataCoverage,
  RealizedPlayerStats,
  MatchDataCoverage,
} from '../services/realizedPoints';
import {
  Search,
  Users,
  ArrowUpDown,
  X,
  TrendingUp,
  ShieldCheck,
  Zap,
  Info,
} from 'lucide-react';

interface PlayersProps {
  dataset: SeasonDataset;
}

type SortField = 'name' | 'price' | 'position' | 'team' | 'points' | 'avgPoints' | 'matches' | 'expectedPoints';
type SortOrder = 'asc' | 'desc';

export const Players: React.FC<PlayersProps> = ({ dataset }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [minPrice] = useState<number>(400);
  const [maxPrice, setMaxPrice] = useState<number>(1500);

  const [sortField, setSortField] = useState<SortField>('points');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Gerçekleşen puanlar tek otorite olan Rust/WASM puanlama motorundan
  // (bkz. services/realizedPoints.ts) asenkron olarak hesaplanır — bkz.
  // BULGU 1: burada hiçbir puan yerel/sentetik bir formülle üretilmez.
  const [playerStatsMap, setPlayerStatsMap] = useState<Map<string, RealizedPlayerStats>>(new Map());
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [coverage, setCoverage] = useState<MatchDataCoverage | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    calculateRealizedPlayerStats(dataset.players, dataset.fixtures).then((map) => {
      if (!cancelled) {
        setPlayerStatsMap(map);
        setStatsLoading(false);
      }
    });
    setCoverage(getMatchDataCoverage(dataset.fixtures));
    return () => {
      cancelled = true;
    };
  }, [dataset.players, dataset.fixtures]);

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
        const statsA = playerStatsMap.get(a.id);
        const statsB = playerStatsMap.get(b.id);

        let valA: string | number = 0;
        let valB: string | number = 0;

        if (sortField === 'name') {
          valA = a.name;
          valB = b.name;
        } else if (sortField === 'price') {
          valA = a.price;
          valB = b.price;
        } else if (sortField === 'position') {
          valA = a.position;
          valB = b.position;
        } else if (sortField === 'team') {
          valA = teamMap.get(a.team_id) || '';
          valB = teamMap.get(b.team_id) || '';
        } else if (sortField === 'points') {
          valA = statsA?.totalPoints ?? 0;
          valB = statsB?.totalPoints ?? 0;
        } else if (sortField === 'avgPoints') {
          valA = statsA?.averagePoints ?? 0;
          valB = statsB?.averagePoints ?? 0;
        } else if (sortField === 'matches') {
          valA = statsA?.matchesWithData ?? 0;
          valB = statsB?.matchesWithData ?? 0;
        } else if (sortField === 'expectedPoints') {
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
  }, [
    dataset.players,
    dataset.projections,
    playerStatsMap,
    searchTerm,
    selectedTeam,
    selectedPosition,
    minPrice,
    maxPrice,
    sortField,
    sortOrder,
    teamMap,
  ]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const selectedPlayerStats = useMemo(() => {
    if (!selectedPlayer) return null;
    return playerStatsMap.get(selectedPlayer.id) || null;
  }, [selectedPlayer, playerStatsMap]);

  const upcomingPlayerFixtures = useMemo(() => {
    if (!selectedPlayer) return [];
    return dataset.fixtures
      .filter(
        (f) =>
          f.status !== 'finished' &&
          (f.home_team_id === selectedPlayer.team_id || f.away_team_id === selectedPlayer.team_id)
      )
      .slice(0, 4);
  }, [selectedPlayer, dataset.fixtures]);

  return (
    <div id="players-page-container" className="space-y-4 animate-fadeIn">
      {/* Top Header */}
      <div id="players-header-bar" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--color-brand)]" />
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Oyuncu Veritabanı & Canlı Puanlar
            </h2>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Oyuncu bazlı maç verisi girilmiş tamamlanan maçlardan Rust/WASM puanlama motoruyla hesaplanan gerçekleşen puanlar ve maç geçmişi
          </p>
        </div>

        {/* Global summary badge */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-xs font-mono">
            <span className="text-[var(--text-muted)]">Kayıtlı: </span>
            <span className="font-bold text-[var(--color-brand)]">{dataset.players.length}</span>
            <span className="text-[var(--text-muted)]"> Oyuncu</span>
          </div>
        </div>
      </div>

      {/* Veri Kapsamı Uyarısı — bitmiş maç sayısı ile oyuncu bazlı veri girilmiş
          maç sayısı farklıysa bunu açıkça göster; sessizce 0 puan gösterip
          "hiç oynamadı" izlenimi vermemek için. */}
      {coverage && coverage.fixturesWithPlayerData < coverage.finishedFixtures && (
        <div
          id="players-data-coverage-notice"
          className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200"
        >
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
          <span>
            {coverage.finishedFixtures} biten maçtan yalnızca{' '}
            <strong>{coverage.fixturesWithPlayerData}</strong> tanesi için oyuncu bazlı maç verisi girildi.
            Verisi henüz girilmemiş maçlarda oynayan oyuncuların Gerçekleşen Puan / Maç sayısı, o maçlar için{' '}
            <strong>"Veri Yok"</strong> olarak gösterilir — tahmini bir değer üretilmez.
          </span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div id="players-filters-card" className="glass-panel p-3.5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
            <input
              id="player-search-input"
              type="text"
              placeholder="Oyuncu ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[var(--bg-card)] border border-[var(--border)] focus:border-[var(--color-brand)] focus:outline-none text-[var(--text-primary)]"
            />
          </div>

          {/* Team Dropdown */}
          <div>
            <select
              id="player-team-select"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-card)] border border-[var(--border)] focus:border-[var(--color-brand)] focus:outline-none text-[var(--text-primary)] cursor-pointer"
            >
              <option value="all">Tüm Kulüpler ({dataset.teams.length})</option>
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
              id="player-position-select"
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-card)] border border-[var(--border)] focus:border-[var(--color-brand)] focus:outline-none text-[var(--text-primary)] cursor-pointer"
            >
              <option value="all">Tüm Mevkiler</option>
              <option value="Goalkeeper">Kaleci (KL)</option>
              <option value="Defender">Defans (DEF)</option>
              <option value="Midfielder">Orta Saha (OS)</option>
              <option value="Forward">Forvet (FOR)</option>
            </select>
          </div>

          {/* Max Price Slider */}
          <div className="flex items-center gap-2 px-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
            <span className="text-[11px] text-[var(--text-muted)] whitespace-nowrap">Maks Fiyat:</span>
            <input
              id="player-price-slider"
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

      {/* Players Data Table */}
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
              <th id="th-sort-matches" onClick={() => handleSort('matches')} className="cursor-pointer hover:text-white text-center">
                <div className="flex items-center justify-center gap-1">
                  <span>OM</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th id="th-sort-points" onClick={() => handleSort('points')} className="cursor-pointer hover:text-white text-right">
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[var(--color-brand)]" title="Sadece oyuncu bazlı maç verisi girilmiş maçlardan hesaplanır">Gerçekleşen Puan</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th id="th-sort-avg" onClick={() => handleSort('avgPoints')} className="cursor-pointer hover:text-white text-right">
                <div className="flex items-center justify-end gap-1">
                  <span>Ort.</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th id="th-sort-xp" onClick={() => handleSort('expectedPoints')} className="cursor-pointer hover:text-white text-right">
                <div className="flex items-center justify-end gap-1">
                  <span>Gelecek xP</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map((player) => {
              const brand = getTeamBranding(player.team_id);
              const teamName = teamMap.get(player.team_id) || player.team_id;
              const stats = playerStatsMap.get(player.id);
              const expectedPoints = dataset.projections.get(player.id)?.expected_points ?? 0;
              const shortPos = getShortPosition(player.position);
              const posColor = getPositionBadgeColor(player.position);

              return (
                <tr
                  key={player.id}
                  id={`player-row-${player.id}`}
                  onClick={() => setSelectedPlayer(player)}
                  className="cursor-pointer hover:bg-white/5 transition-colors"
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
                      <span className="truncate max-w-[130px]">{teamName}</span>
                    </span>
                  </td>
                  <td className="font-mono font-bold text-[var(--color-brand)]">
                    {formatPrice(player.price)}
                  </td>
                  <td className="text-center font-mono text-xs text-[var(--text-muted)]">
                    {stats?.matchesWithData ?? 0}
                  </td>
                  <td className="text-right">
                    {statsLoading ? (
                      <span className="font-mono text-xs text-[var(--text-muted)] opacity-60">…</span>
                    ) : (stats?.matchesWithData ?? 0) === 0 ? (
                      <span
                        className="font-mono text-xs text-[var(--text-muted)] opacity-60"
                        title="Bu oyuncunun takımının maçları için henüz oyuncu bazlı veri girilmedi"
                      >
                        Veri Yok
                      </span>
                    ) : (
                      <span className="sofa-rating sofa-rating-high font-mono font-bold text-xs">
                        {stats?.totalPoints} pts
                      </span>
                    )}
                  </td>
                  <td className="text-right font-mono text-xs text-[var(--text-secondary)]">
                    {(stats?.matchesWithData ?? 0) === 0 ? '-' : stats?.averagePoints.toFixed(1)}
                  </td>
                  <td className="text-right font-mono text-xs text-[var(--text-muted)]">
                    {expectedPoints > 0 ? `${expectedPoints.toFixed(1)} xP` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Player Detail Drawer Modal */}
      {selectedPlayer && (
        <div
          id="player-detail-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedPlayer(null)}
        >
          <div
            id="player-detail-modal"
            className="glass-panel w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shadow border"
                  style={{
                    background: getTeamBranding(selectedPlayer.team_id).primaryColor,
                    color: getTeamBranding(selectedPlayer.team_id).textColor,
                  }}
                >
                  {getTeamBranding(selectedPlayer.team_id).code}
                </div>
                <div>
                  <h3 id="player-modal-name" className="font-extrabold text-base sm:text-lg text-[var(--text-primary)]">
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
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
                <div className="text-[10px] text-[var(--text-muted)] uppercase">Gerçekleşen Puan</div>
                <div id="player-modal-total-pts" className="font-black text-base text-[var(--color-brand)] flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>
                    {(selectedPlayerStats?.matchesWithData ?? 0) === 0
                      ? 'Veri Yok'
                      : `${selectedPlayerStats?.totalPoints} pts`}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
                <div className="text-[10px] text-[var(--text-muted)] uppercase">Maç Başı Ort.</div>
                <div id="player-modal-avg-pts" className="font-black text-base text-[var(--text-primary)]">
                  {(selectedPlayerStats?.matchesWithData ?? 0) === 0
                    ? '-'
                    : `${selectedPlayerStats?.averagePoints.toFixed(1)} pts`}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
                <div className="text-[10px] text-[var(--text-muted)] uppercase">Kadro Değeri</div>
                <div id="player-modal-price" className="font-black text-base text-amber-400">
                  {formatPrice(selectedPlayer.price)}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
                <div className="text-[10px] text-[var(--text-muted)] uppercase">Gelecek xP</div>
                <div id="player-modal-expected-pts" className="font-black text-base text-blue-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{dataset.projections.get(selectedPlayer.id)?.expected_points.toFixed(1) ?? '0.0'}</span>
                </div>
              </div>
            </div>

            {/* Completed Matches Performance Breakdown */}
            <div id="player-modal-match-history" className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[var(--text-muted)] border-b border-[var(--border)] pb-1">
                <span>Tamamlanan Maç Performansları</span>
                <span className="font-mono">{selectedPlayerStats?.matchesWithData ?? 0} Maç Oynandı</span>
              </div>

              {(selectedPlayerStats?.matchHistory.length ?? 0) === 0 ? (
                <div className="p-3 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-card)] rounded-lg border border-[var(--border)]">
                  Henüz tamamlanmış maç verisi bulunmamaktadır.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {selectedPlayerStats?.matchHistory.map((m) => {
                    const oppName = teamMap.get(m.opponentTeamId) || m.opponentTeamId;
                    const scoreText = `${m.teamGoals} - ${m.opponentGoals}`;

                    return (
                      <div
                        key={m.fixtureId}
                        className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[10px] font-mono text-[var(--text-muted)]">
                            H{m.round}
                          </span>
                          <span className="font-medium text-[var(--text-primary)]">
                            {m.isHome ? 'vs' : '@'} {oppName}
                          </span>
                          <span className={`text-[11px] font-mono font-bold ${m.won ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                            ({scoreText})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {m.cleanSheet && (
                            <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-mono" title="Golsüz Tamamlandı">
                              <ShieldCheck className="w-3 h-3" />
                              <span>CS</span>
                            </span>
                          )}
                          <span className="sofa-rating sofa-rating-high font-mono font-bold text-xs">
                            +{m.points} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Upcoming Fixtures */}
            <div id="player-modal-fixtures" className="space-y-2">
              <div className="text-[11px] font-bold uppercase text-[var(--text-muted)] border-b border-[var(--border)] pb-1">
                Sıradaki Karşılaşmalar
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {upcomingPlayerFixtures.map((f) => {
                  const isHome = f.home_team_id === selectedPlayer.team_id;
                  const oppId = isHome ? f.away_team_id : f.home_team_id;
                  const oppName = teamMap.get(oppId) || oppId;

                  return (
                    <div
                      key={f.id}
                      className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-[var(--text-muted)]">H{f.round}</span>
                        <span className="font-semibold text-[var(--text-primary)] truncate max-w-[120px]">
                          {isHome ? 'Ev Sahibi vs' : 'Dep vs'} {oppName}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-blue-400">
                        {f.status === 'live' ? 'CANLI' : 'Planlandı'}
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
