import React, { useState, useMemo } from 'react';
import { SeasonDataset } from '../types';
import { Calendar, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface FixturesProps {
  dataset: SeasonDataset;
}

export const Fixtures: React.FC<FixturesProps> = ({ dataset }) => {
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [teamSearch, setTeamSearch] = useState<string>('');

  const teamMap = useMemo(() => {
    const map = new Map<string, string>();
    dataset.teams.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [dataset.teams]);

  // Unique rounds available in dataset (1 to 34)
  const rounds = useMemo(() => {
    const set = new Set<number>();
    dataset.fixtures.forEach((f) => set.add(f.round));
    return Array.from(set).sort((a, b) => a - b);
  }, [dataset.fixtures]);

  // Filtered Fixtures
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
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Calendar className="w-6 h-6 text-cyan-500" />
            <span>2026/27 Süper Lig Fikstürü</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Toplam {dataset.fixtures.length} karşılaşma / 34 Hafta programı
          </p>
        </div>

        {/* Round Navigation Quick Switch */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedRound(Math.max(1, selectedRound - 1))}
            disabled={selectedRound <= 1}
            className="btn btn-secondary p-2 disabled:opacity-40"
            title="Önceki Hafta"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-sm font-bold font-mono px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
            Hafta {selectedRound} / 34
          </div>
          <button
            onClick={() => setSelectedRound(Math.min(34, selectedRound + 1))}
            disabled={selectedRound >= 34}
            className="btn btn-secondary p-2 disabled:opacity-40"
            title="Sonraki Hafta"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter & Round Selector Bar */}
      <div className="glass-panel p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Round Selector Dropdown */}
          <div className="w-full sm:w-48">
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(Number(e.target.value))}
              className="form-select"
            >
              <option value={0}>Tüm Haftalar (306 Maç)</option>
              {rounds.map((r) => (
                <option key={r} value={r}>
                  {r}. Hafta
                </option>
              ))}
            </select>
          </div>

          {/* Team Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Takım adına göre ara..."
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              className="form-input pl-9"
            />
          </div>

          {/* Quick Round Pills */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none ml-auto">
            {[1, 2, 3, 4, 5, 10, 19, 34].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRound(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  selectedRound === r
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                H{r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fixtures List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFixtures.length > 0 ? (
          filteredFixtures.map((fixture) => {
            const homeName = teamMap.get(fixture.home_team_id) || fixture.home_team_id;
            const awayName = teamMap.get(fixture.away_team_id) || fixture.away_team_id;

            return (
              <div
                key={fixture.id}
                className="glass-panel p-5 flex flex-col justify-between hover:border-cyan-500/40 transition-all space-y-4"
              >
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span className="font-semibold text-cyan-400">Hafta {fixture.round}</span>
                  <span className="font-mono bg-[var(--bg-surface)] px-2 py-0.5 rounded border border-[var(--border-color)]">
                    {fixture.kickoff}
                  </span>
                </div>

                <div className="grid grid-cols-5 items-center text-center gap-2 py-2">
                  {/* Home Team */}
                  <div className="col-span-2 space-y-1">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                      {homeName.charAt(0)}
                    </div>
                    <div className="font-bold text-sm text-[var(--text-primary)] leading-tight truncate">
                      {homeName}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Ev Sahibi</div>
                  </div>

                  {/* VS Badge */}
                  <div className="col-span-1">
                    <div className="w-8 h-8 mx-auto rounded-full bg-cyan-500/10 text-cyan-400 font-extrabold text-xs flex items-center justify-center border border-cyan-500/20">
                      VS
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className="col-span-2 space-y-1">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                      {awayName.charAt(0)}
                    </div>
                    <div className="font-bold text-sm text-[var(--text-primary)] leading-tight truncate">
                      {awayName}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Deplasman</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-color)]">
                  <span>Match ID: {fixture.id}</span>
                  <span className="capitalize">{fixture.status}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 glass-panel p-12 text-center text-[var(--text-muted)]">
            Seçilen filtrelere uygun fikstür bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
};
