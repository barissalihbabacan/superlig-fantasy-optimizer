import React, { useState, useMemo } from 'react';
import { SeasonDataset, Fixture } from '../types';
import { getTeamBranding, formatDateDDMMYYYY, getCurrentActiveRound } from '../services/dataset';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  MapPin,
  CalendarDays,
} from 'lucide-react';

interface FixturesProps {
  dataset: SeasonDataset;
  onSelectFixture: (fixture: Fixture) => void;
}

export const Fixtures: React.FC<FixturesProps> = ({ dataset, onSelectFixture }) => {
  const [activeView, setActiveView] = useState<'fixtures' | 'standings'>('fixtures');
  const [selectedRound, setSelectedRound] = useState<number>(() => getCurrentActiveRound(dataset.fixtures));
  const [teamSearch, setTeamSearch] = useState<string>('');

  const teamMap = useMemo(() => {
    const map = new Map<string, string>();
    dataset.teams.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [dataset.teams]);

  // Dynamically calculate Süper Lig live standings from all finished fixtures
  const standings = useMemo(() => {
    const tableMap: Record<
      string,
      {
        id: string;
        name: string;
        played: number;
        wins: number;
        draws: number;
        losses: number;
        gf: number;
        ga: number;
        gd: number;
        pts: number;
        form: string[];
      }
    > = {};

    // Initialize all teams
    dataset.teams.forEach((t) => {
      tableMap[t.id] = {
        id: t.id,
        name: t.name,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0,
        form: [],
      };
    });

    // Process finished matches
    dataset.fixtures.forEach((f) => {
      if (f.status === 'finished' && f.score) {
        const home = tableMap[f.home_team_id];
        const away = tableMap[f.away_team_id];
        if (home && away) {
          home.played += 1;
          away.played += 1;
          home.gf += f.score.home;
          home.ga += f.score.away;
          away.gf += f.score.away;
          away.ga += f.score.home;

          if (f.score.home > f.score.away) {
            home.wins += 1;
            home.pts += 3;
            home.form.push('G');
            away.losses += 1;
            away.form.push('M');
          } else if (f.score.home < f.score.away) {
            away.wins += 1;
            away.pts += 3;
            away.form.push('G');
            home.losses += 1;
            home.form.push('M');
          } else {
            home.draws += 1;
            home.pts += 1;
            home.form.push('B');
            away.draws += 1;
            away.pts += 1;
            away.form.push('B');
          }
        }
      }
    });

    // Calculate GD and sort
    const list = Object.values(tableMap).map((row) => ({
      ...row,
      gd: row.gf - row.ga,
    }));

    return list.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.name.localeCompare(b.name, 'tr');
    });
  }, [dataset.teams, dataset.fixtures]);

  const rounds = useMemo(() => {
    const set = new Set<number>();
    dataset.fixtures.forEach((f) => set.add(f.round));
    return Array.from(set).sort((a, b) => a - b);
  }, [dataset.fixtures]);

  const filteredFixtures = useMemo(() => {
    return dataset.fixtures.filter((f) => {
      if (selectedRound !== 0 && f.round !== selectedRound) {
        return false;
      }
      if (teamSearch) {
        const homeName = (teamMap.get(f.home_team_id) || '').toLowerCase();
        const awayName = (teamMap.get(f.away_team_id) || '').toLowerCase();
        const q = teamSearch.toLowerCase();
        if (!homeName.includes(q) && !awayName.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [dataset.fixtures, selectedRound, teamSearch, teamMap]);

  return (
    <div id="fixtures-page-container" className="space-y-4 animate-fadeIn">
      {/* Top Header & View Switcher */}
      <div id="fixtures-header-bar" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[var(--color-brand)]" />
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
              {activeView === 'fixtures' ? 'Fikstür & Canlı Skorlar' : 'Trendyol Süper Lig Puan Durumu'}
            </h2>
          </div>

          {/* View Switcher Pills */}
          <div className="flex items-center p-0.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
            <button
              id="view-fixtures-tab-btn"
              onClick={() => setActiveView('fixtures')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                activeView === 'fixtures'
                  ? 'bg-[var(--color-brand)] text-black shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              Fikstür ({dataset.fixtures.length})
            </button>
            <button
              id="view-standings-tab-btn"
              onClick={() => setActiveView('standings')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                activeView === 'standings'
                  ? 'bg-[var(--color-brand)] text-black shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              Puan Durumu (18)
            </button>
          </div>
        </div>

        {/* Round Navigation Bar (Only for Fixtures view) */}
        {activeView === 'fixtures' && (
          <div id="round-navigation-controls" className="flex items-center gap-1 self-start sm:self-auto">
            <button
              id="prev-round-btn"
              onClick={() => setSelectedRound((prev) => Math.max(1, (prev === 0 ? 1 : prev) - 1))}
              disabled={selectedRound <= 1}
              className="p-1 h-6 rounded bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-white disabled:opacity-30 flex items-center justify-center transition-colors"
              title="Önceki Hafta"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div id="current-round-display" className="px-2.5 h-6 rounded bg-[var(--bg-card)] border border-[var(--border)] font-mono text-[11px] font-bold text-[var(--text-primary)] flex items-center justify-center tracking-wide shadow-xs">
              {selectedRound === 0 ? 'Tüm Haftalar' : `${selectedRound}. HAFTA`}
            </div>
            <button
              id="next-round-btn"
              onClick={() => setSelectedRound((prev) => Math.min(34, (prev === 0 ? 1 : prev) + 1))}
              disabled={selectedRound >= 34}
              className="p-1 h-6 rounded bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-white disabled:opacity-30 flex items-center justify-center transition-colors"
              title="Sonraki Hafta"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {activeView === 'fixtures' ? (
        <>
          {/* Filter Bar */}
          <div id="fixtures-filter-toolbar" className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="w-full sm:w-44">
              <select
                id="fixtures-round-select"
                value={selectedRound}
                onChange={(e) => setSelectedRound(Number(e.target.value))}
                className="form-select-sofa font-medium"
              >
                <option value={0}>Tüm Haftalar (306 Maç)</option>
                {rounds.map((r) => (
                  <option key={r} value={r}>
                    {r}. Hafta
                  </option>
                ))}
              </select>
            </div>

            <div className="sofa-search-container sm:w-64">
              <Search />
              <input
                id="fixtures-team-search-input"
                type="text"
                placeholder="Takım ara (GS, FB, BJK...)"
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="form-input-sofa"
              />
            </div>

            {/* Quick round chips */}
            <div id="quick-round-chips" className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none sm:ml-auto">
              {[1, 2, 3, 4, 5, 10, 19, 34].map((r) => (
                <button
                  key={r}
                  id={`quick-round-pill-${r}`}
                  onClick={() => setSelectedRound(r)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                    selectedRound === r
                      ? 'bg-[var(--color-brand)] text-black'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)]'
                  }`}
                >
                  H{r}
                </button>
              ))}
            </div>
          </div>

          {/* Match Cards List */}
          <div id="fixtures-grid-list" className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filteredFixtures.length > 0 ? (
              filteredFixtures.map((fixture) => {
                const homeName = teamMap.get(fixture.home_team_id) || fixture.home_team_id;
                const awayName = teamMap.get(fixture.away_team_id) || fixture.away_team_id;
                const homeBrand = getTeamBranding(fixture.home_team_id);
                const awayBrand = getTeamBranding(fixture.away_team_id);
                const isFinished = fixture.status === 'finished';
                const hasScore = fixture.score !== undefined && fixture.score !== null;

                return (
                  <div
                    key={fixture.id}
                    id={`fixture-card-${fixture.id}`}
                    onClick={() => onSelectFixture(fixture)}
                    className="sofa-card p-3.5 flex flex-col justify-between hover:bg-[var(--bg-card-hover)] cursor-pointer transition-colors space-y-3"
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between text-[11px] pb-2 border-b border-[var(--border)]">
                      <span className="font-mono font-bold text-[var(--text-secondary)]">
                        {fixture.round}. Hafta
                      </span>

                      {isFinished ? (
                        <span className="sofa-badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-mono">
                          <CheckCircle2 className="w-3 h-3" />
                          Maç Sonucu (MS)
                        </span>
                      ) : (
                        <span className="sofa-badge bg-[var(--bg-surface)] text-[var(--text-muted)] font-mono border border-[var(--border)] flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-[var(--color-brand)]" />
                          <span className="text-[var(--color-brand)] font-bold">{formatDateDDMMYYYY(fixture.kickoff)}</span>
                          <span>·</span>
                          <span>{fixture.kickoff.includes('T') ? fixture.kickoff.split('T')[1].slice(0, 5) : 'Planlandı'}</span>
                        </span>
                      )}
                    </div>

                    {/* Match Scoreline */}
                    <div className="grid grid-cols-5 items-center gap-2 py-1">
                      {/* Home Team */}
                      <div className="col-span-2 flex items-center gap-2 min-w-0">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shadow border flex-shrink-0"
                          style={{
                            background: homeBrand.primaryColor,
                            color: homeBrand.textColor,
                            borderColor: homeBrand.secondaryColor,
                          }}
                        >
                          {homeBrand.code}
                        </div>
                        <div className="font-bold text-xs sm:text-sm text-[var(--text-primary)] truncate">
                          {homeName}
                        </div>
                      </div>

                      {/* Score or VS */}
                      <div className="col-span-1 text-center flex items-center justify-center">
                        {isFinished && hasScore ? (
                          <div className="font-mono font-black text-base sm:text-lg px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-strong)]">
                            {fixture.score?.home} - {fixture.score?.away}
                          </div>
                        ) : (
                          <div className="font-mono text-xs font-bold text-[var(--text-muted)]">
                            VS
                          </div>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className="col-span-2 flex items-center justify-end gap-2 min-w-0 text-right">
                        <div className="font-bold text-xs sm:text-sm text-[var(--text-primary)] truncate">
                          {awayName}
                        </div>
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shadow border flex-shrink-0"
                          style={{
                            background: awayBrand.primaryColor,
                            color: awayBrand.textColor,
                            borderColor: awayBrand.secondaryColor,
                          }}
                        >
                          {awayBrand.code}
                        </div>
                      </div>
                    </div>

                    {/* Footer stadium info */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-[var(--color-brand)]" />
                        {homeBrand.stadium}
                      </span>
                      <span className="text-[var(--color-brand)] font-bold">
                        Maç Raporu →
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div id="fixtures-empty-state" className="col-span-2 sofa-card p-8 text-center text-xs text-[var(--text-muted)]">
                Arama kriterine uygun fikstür bulunamadı.
              </div>
            )}
          </div>
        </>
      ) : (
        /* Standings View for Regular Users */
        <div id="standings-table-container" className="sofa-card overflow-hidden">
          <div className="p-3 sm:px-4 bg-[var(--bg-surface)] border-b border-[var(--border)] flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
              2026-2027 Sezonu Puan Cetveli
            </span>
            <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Canlı Puan Durumu
            </span>
          </div>

          <div className="overflow-x-auto">
            <table id="superlig-standings-table" className="sofa-table w-full">
              <thead>
                <tr>
                  <th className="w-10 text-center">#</th>
                  <th>Kulüp</th>
                  <th className="text-center font-mono">O</th>
                  <th className="text-center font-mono">G</th>
                  <th className="text-center font-mono">B</th>
                  <th className="text-center font-mono">M</th>
                  <th className="text-center font-mono">AG</th>
                  <th className="text-center font-mono">YG</th>
                  <th className="text-center font-mono">AV</th>
                  <th className="text-right font-mono">Puan</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, idx) => {
                  const brand = getTeamBranding(row.id);
                  return (
                    <tr key={row.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                      <td className="text-center font-mono font-bold text-xs">
                        <span
                          className={`w-6 h-6 inline-flex items-center justify-center rounded ${
                            idx === 0
                              ? 'bg-amber-400/20 text-amber-300 font-black'
                              : idx < 4
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : idx >= 15
                              ? 'bg-rose-500/15 text-rose-400'
                              : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-1.5 h-4 rounded-full flex-shrink-0"
                            style={{ background: brand.primaryColor }}
                          />
                          <span className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                            {row.name}
                          </span>
                        </div>
                      </td>
                      <td className="text-center font-mono text-xs">{row.played}</td>
                      <td className="text-center font-mono text-xs text-emerald-400 font-bold">{row.wins}</td>
                      <td className="text-center font-mono text-xs text-[var(--text-muted)]">{row.draws}</td>
                      <td className="text-center font-mono text-xs text-rose-400">{row.losses}</td>
                      <td className="text-center font-mono text-xs text-[var(--text-muted)]">{row.gf}</td>
                      <td className="text-center font-mono text-xs text-[var(--text-muted)]">{row.ga}</td>
                      <td className={`text-center font-mono text-xs font-bold ${row.gd > 0 ? 'text-emerald-400' : row.gd < 0 ? 'text-rose-400' : 'text-[var(--text-muted)]'}`}>
                        {row.gd > 0 ? `+${row.gd}` : row.gd}
                      </td>
                      <td className="text-right font-mono font-black text-xs sm:text-sm text-[var(--color-brand)]">
                        {row.pts}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
