import React, { useState, useEffect } from 'react';
import { SeasonDataset, NavTab, Fixture } from '../types';
import { formatPrice, getTeamBranding, formatDateDDMMYYYY, getCurrentActiveRound } from '../services/dataset';
import {
  Trophy,
  Calendar,
  Zap,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Star,
  Clock,
} from 'lucide-react';

interface DashboardProps {
  dataset: SeasonDataset;
  selectedRound?: number;
  onSelectRound?: (round: number) => void;
  setActiveTab: (tab: NavTab) => void;
  onSelectFixture: (fixture: Fixture) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  dataset,
  selectedRound,
  onSelectRound,
  setActiveTab,
  onSelectFixture,
}) => {
  const autoActiveRound = getCurrentActiveRound(dataset.fixtures);
  const activeRound = selectedRound ?? autoActiveRound;
  const activeRoundFixtures = dataset.fixtures.filter((f) => f.round === activeRound);
  const maxRound = 34;

  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Reset index when round changes
  useEffect(() => {
    setCarouselIndex(0);
  }, [activeRound]);

  // Autoplay carousel slides every 6 seconds if not hovered
  useEffect(() => {
    if (isPaused || activeRoundFixtures.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev < activeRoundFixtures.length - 1 ? prev + 1 : 0));
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, activeRoundFixtures.length]);

  const currentSlideFixture = activeRoundFixtures[carouselIndex] || activeRoundFixtures[0];
  const homeName = dataset.teams.find((t) => t.id === currentSlideFixture?.home_team_id)?.name || currentSlideFixture?.home_team_id;
  const awayName = dataset.teams.find((t) => t.id === currentSlideFixture?.away_team_id)?.name || currentSlideFixture?.away_team_id;
  const homeBrand = getTeamBranding(currentSlideFixture?.home_team_id || '');
  const awayBrand = getTeamBranding(currentSlideFixture?.away_team_id || '');
  const isFinished = currentSlideFixture?.status === 'finished';
  const hasScore = currentSlideFixture?.score !== undefined && currentSlideFixture?.score !== null;

  const handlePrevRound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectRound) {
      onSelectRound(activeRound > 1 ? activeRound - 1 : maxRound);
    }
  };

  const handleNextRound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectRound) {
      onSelectRound(activeRound < maxRound ? activeRound + 1 : 1);
    }
  };

  // Top performers from the played matches in Week 1
  const topPerformers = [
    { id: 'victor-james-osimhen', name: 'Victor Osimhen', team: 'Galatasaray', pos: 'FOR', pts: 13, price: 1200, stats: '2 Gol · 38 Şut' },
    { id: 'ali-sowe', name: 'Ali Sowe', team: 'Çaykur Rizespor', pos: 'FOR', pts: 9, price: 550, stats: '1 Gol · Maçın Adamı' },
    { id: 'simon-banza', name: 'Simon Banza', team: 'Trabzonspor', pos: 'FOR', pts: 9, price: 850, stats: '1 Gol · Maçın Adamı' },
    { id: 'irfan-can-egribayat', name: 'İrfan Can Eğribayat', team: 'Gençlerbirliği', pos: 'KL', pts: 8, price: 450, stats: '7 Kurtarış · Maçın Adamı' },
    { id: 'paulo-victor-mileo-vidotti', name: 'Paulo Victor', team: 'Alanyaspor', pos: 'KL', pts: 8, price: 500, stats: '6 Kurtarış · Maçın Adamı' },
    { id: 'franco-tongya', name: 'Franco Tongya', team: 'Gençlerbirliği', pos: 'OS', pts: 8, price: 500, stats: '1 Gol' },
  ];

  return (
    <div id="dashboard-page-container" className="space-y-2.5 animate-fadeIn">
      {/* Featured Matches Carousel (Haftaya Göre Dinamik) */}
      {currentSlideFixture && (
        <div
          id="featured-match-carousel"
          className="sofa-card overflow-hidden border-[var(--border-strong)] relative group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Header Bar with Round Selector & Slide Navigator */}
          <div className="px-4 py-2 bg-[var(--bg-surface)] border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isFinished ? 'bg-emerald-500 animate-pulse' : 'bg-blue-400'}`} />
              
              {/* Round Switcher Pill in Carousel */}
              <div className="flex items-center gap-1 bg-[var(--bg-card)] px-2 py-0.5 rounded border border-[var(--border)]">
                {onSelectRound && (
                  <button
                    onClick={handlePrevRound}
                    className="text-[var(--text-muted)] hover:text-white transition-colors"
                    title="Önceki Hafta"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                )}
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-brand)]">
                  {activeRound}. Hafta
                </span>
                {onSelectRound && (
                  <button
                    onClick={handleNextRound}
                    className="text-[var(--text-muted)] hover:text-white transition-colors"
                    title="Sonraki Hafta"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <span className="text-xs text-[var(--text-muted)] font-mono hidden sm:inline">
                ({carouselIndex + 1}/{activeRoundFixtures.length})
              </span>
            </div>

            {/* Carousel Controls & Pagination Dots */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1">
                {activeRoundFixtures.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      carouselIndex === i
                        ? 'w-5 bg-[var(--color-brand)]'
                        : 'w-1.5 bg-[var(--border-strong)] hover:bg-[var(--text-muted)]'
                    }`}
                    title={`Maç ${i + 1}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1 ml-2">
                <button
                  id="carousel-prev-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCarouselIndex((prev) => (prev > 0 ? prev - 1 : activeRoundFixtures.length - 1));
                  }}
                  className="p-1 rounded bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-white"
                  title="Önceki Maç"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  id="carousel-next-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCarouselIndex((prev) => (prev < activeRoundFixtures.length - 1 ? prev + 1 : 0));
                  }}
                  className="p-1 rounded bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-white"
                  title="Sonraki Maç"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Slide Body with Fixed Locked Height */}
          <div
            id="featured-match-trigger"
            onClick={() => onSelectFixture(currentSlideFixture)}
            className="p-5 sm:p-6 cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors select-none h-[150px] sm:h-[156px] flex flex-col justify-between"
          >
            <div className="grid grid-cols-3 items-center">
              {/* Home Team */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shadow border-2 flex-shrink-0"
                  style={{
                    background: homeBrand.primaryColor,
                    color: homeBrand.textColor,
                    borderColor: homeBrand.secondaryColor,
                  }}
                >
                  {homeBrand.code}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-sm sm:text-base text-[var(--text-primary)] truncate">
                    {homeName}
                  </h3>
                  <div className="text-[11px] text-[var(--text-muted)] font-mono truncate h-[18px] flex items-center">
                    {isFinished && currentSlideFixture.id === '2026-27-w01-01' ? '⚽ Osimhen 53\', 90\'' : 'Ev Sahibi'}
                  </div>
                </div>
              </div>

              {/* Scoreline or Time Center (Fixed 56px height) */}
              <div className="h-[56px] flex flex-col items-center justify-center text-center">
                {isFinished && hasScore ? (
                  <>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-strong)]">
                      <span className="font-mono font-black text-xl sm:text-2xl text-[var(--text-primary)]">
                        {currentSlideFixture.score?.home}
                      </span>
                      <span className="font-mono text-sm text-[var(--text-muted)]">:</span>
                      <span className="font-mono font-black text-xl sm:text-2xl text-[var(--text-primary)]">
                        {currentSlideFixture.score?.away}
                      </span>
                    </div>
                    <div className="mt-1">
                      <span className="sofa-badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-mono text-[9px] py-0.2">
                        Maç Sonucu (MS)
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] font-mono font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                      <Clock className="w-3.5 h-3.5 text-[var(--color-brand)]" />
                      <span>{currentSlideFixture.kickoff.includes('T') ? currentSlideFixture.kickoff.split('T')[1].slice(0, 5) : 'Planlandı'}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        {formatDateDDMMYYYY(currentSlideFixture.kickoff) || '1. Hafta'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Away Team */}
              <div className="flex items-center justify-end gap-3 text-right min-w-0">
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-sm sm:text-base text-[var(--text-primary)] truncate">
                    {awayName}
                  </h3>
                  <div className="text-[11px] text-[var(--text-muted)] font-mono truncate h-[18px] flex items-center justify-end">
                    {isFinished && currentSlideFixture.id === '2026-27-w01-01' ? 'Kyziridis 59\', Ramírez 61\' ⚽' : 'Deplasman'}
                  </div>
                </div>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shadow border-2 flex-shrink-0"
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

            <div className="pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1 font-mono truncate">
                <MapPin className="w-3.5 h-3.5 text-[var(--color-brand)] flex-shrink-0" />
                <span className="truncate">{homeBrand.stadium}, {homeBrand.city}</span>
              </span>
              <span className="text-[var(--color-brand)] font-bold flex items-center gap-0.5 flex-shrink-0 ml-2">
                {isFinished ? 'Detaylı Maç Raporu' : 'Maç Detay Sayfası'} <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Sports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-3.5 items-stretch -mt-0.5 sm:-mt-1">
        {/* Left Column: Gameweek 1 Fixtures Schedule (7 cols) */}
        <div id="gameweek-fixtures-section" className="lg:col-span-7 flex flex-col space-y-2">
          <div className="flex items-center justify-between pb-0.5 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--color-brand)]" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-[var(--text-primary)]">
                {activeRound}. Hafta Maç Takvimi
              </h3>
            </div>
            <button
              id="view-all-fixtures-btn"
              onClick={() => setActiveTab('fixtures')}
              className="text-xs text-[var(--color-brand)] hover:underline font-bold flex items-center gap-0.5"
            >
              Tüm Fikstür <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div id="gameweek-fixtures-list" className="sofa-card divide-y divide-[var(--border)] overflow-hidden flex-1 flex flex-col justify-between">
            {activeRoundFixtures.map((fixture) => {
              const fHomeName = dataset.teams.find((t) => t.id === fixture.home_team_id)?.name || fixture.home_team_id;
              const fAwayName = dataset.teams.find((t) => t.id === fixture.away_team_id)?.name || fixture.away_team_id;
              const fHomeBrand = getTeamBranding(fixture.home_team_id);
              const fAwayBrand = getTeamBranding(fixture.away_team_id);
              const fIsFinished = fixture.status === 'finished';

              return (
                <div
                  key={fixture.id}
                  id={`dashboard-fixture-item-${fixture.id}`}
                  onClick={() => onSelectFixture(fixture)}
                  className="p-2 sm:px-3.5 flex items-center justify-between hover:bg-[var(--bg-card-hover)] cursor-pointer transition-colors flex-1"
                >
                  {/* Home Team */}
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span
                      className="w-1.5 h-4 rounded-full flex-shrink-0"
                      style={{ background: fHomeBrand.primaryColor }}
                    />
                    <span className="font-bold text-xs sm:text-sm text-[var(--text-primary)] truncate">
                      {fHomeName}
                    </span>
                  </div>

                  {/* Score / Time Box */}
                  <div className="px-2.5 flex-shrink-0 text-center min-w-[76px]">
                    {fIsFinished && fixture.score ? (
                      <div className="flex flex-col items-center">
                        <div className="font-mono font-black text-xs sm:text-sm px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border)] leading-tight">
                          {fixture.score.home} - {fixture.score.away}
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold mt-0.5">
                          MS
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border)] leading-tight">
                          {fixture.kickoff.includes('T') ? fixture.kickoff.split('T')[1].slice(0, 5) : 'Planlandı'}
                        </div>
                        <span className="text-[10px] font-mono text-[var(--color-brand)] font-semibold mt-0.5 whitespace-nowrap">
                          {formatDateDDMMYYYY(fixture.kickoff)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex-1 flex items-center justify-end gap-2 min-w-0 text-right">
                    <span className="font-bold text-xs sm:text-sm text-[var(--text-primary)] truncate">
                      {fAwayName}
                    </span>
                    <span
                      className="w-1.5 h-4 rounded-full flex-shrink-0"
                      style={{ background: fAwayBrand.primaryColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Top Performers & Quick Optimizer (5 cols) */}
        <div id="dashboard-sidebar-section" className="lg:col-span-5 flex flex-col justify-between space-y-2.5">
          {/* Top Performers Table */}
          <div id="top-performers-card" className="space-y-2 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-0.5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-[var(--text-primary)]">
                  Haftanın En İyileri
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">Fantasy Puanı</span>
            </div>

            <div className="sofa-card divide-y divide-[var(--border)] overflow-hidden flex-1 flex flex-col justify-between">
              {topPerformers.map((player, idx) => (
                <div
                  key={player.id}
                  id={`top-performer-item-${player.id}`}
                  className="p-2 sm:px-3 flex items-center justify-between gap-2 hover:bg-[var(--bg-card-hover)] transition-colors flex-1"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 ${
                      idx === 0 ? 'bg-[var(--color-brand)] text-black' : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                    }`}>
                      {idx === 0 ? <Star className="w-3 h-3 fill-current" /> : idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="font-bold text-xs text-[var(--text-primary)] truncate">
                        {player.name}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 font-mono">
                        <span>{player.team}</span>
                        <span>·</span>
                        <span>{formatPrice(player.price)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="sofa-rating sofa-rating-high font-mono text-xs">
                      {player.pts} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Optimizer Banner */}
          <div id="quick-optimizer-banner" className="sofa-card p-3 bg-gradient-to-r from-[var(--bg-card)] to-[var(--bg-surface)] border-[var(--border-strong)] flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[var(--color-brand)]" />
                  <span className="font-extrabold text-xs sm:text-sm text-[var(--text-primary)]">
                    Kadro Optimizer'ı
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  100M TL ile en yüksek expected point getiren 11'i kurun.
                </p>
              </div>
              <button
                id="quick-start-optimizer-btn"
                onClick={() => setActiveTab('optimizer')}
                className="btn-sofa btn-sofa-primary text-xs flex-shrink-0 py-1.5 px-3"
              >
                Kadroyu Kur
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div id="dashboard-quick-stats" className="grid grid-cols-3 gap-2 flex-shrink-0">
            <div
              id="stat-players-card"
              onClick={() => setActiveTab('players')}
              className="sofa-card p-2.5 cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors text-center"
            >
              <div className="text-[10px] font-mono uppercase text-[var(--text-muted)]">Oyuncu</div>
              <div className="text-base font-black font-mono text-[var(--text-primary)] mt-0.5">
                {dataset.players.length}
              </div>
            </div>

            <div
              id="stat-teams-card"
              onClick={() => setActiveTab('teams')}
              className="sofa-card p-2.5 cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors text-center"
            >
              <div className="text-[10px] font-mono uppercase text-[var(--text-muted)]">Kulüp</div>
              <div className="text-base font-black font-mono text-[var(--text-primary)] mt-0.5">
                {dataset.teams.length}
              </div>
            </div>

            <div
              id="stat-projections-card"
              onClick={() => setActiveTab('nostradamus')}
              className="sofa-card p-2.5 cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors text-center"
            >
              <div className="text-[10px] font-mono uppercase text-[var(--text-muted)]">Projeksiyon</div>
              <div className="text-base font-black font-mono text-[var(--color-brand)] mt-0.5">
                {dataset.projections.size}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
