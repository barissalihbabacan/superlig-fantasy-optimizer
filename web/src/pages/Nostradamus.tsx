import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { SeasonDataset, Fixture } from '../types';
import { getTeamBranding, getCurrentActiveRound } from '../services/dataset';
import {
  loadAllPredictions,
  saveWeeklyPredictions,
  loadMatchResultsOverrides,
  WeeklyPredictions,
  PredictionType,
} from '../services/nostradamusStorage';
import { calculateMatchProbabilities } from '../services/matchPredictor';
import {
  Brain,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Lock,
  Calendar,
  ChevronRight,
  X,
  Target,
  Award,
  RotateCcw,
  Calculator,
} from 'lucide-react';

interface NostradamusProps {
  dataset: SeasonDataset;
  onSelectFixture?: (fixture: Fixture) => void;
}

export const Nostradamus: React.FC<NostradamusProps> = ({ dataset, onSelectFixture }) => {
  const [selectedRound, setSelectedRound] = useState<number>(() => getCurrentActiveRound(dataset.fixtures));
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);

  // Predictions state loaded directly from localStorage
  const [predictions, setPredictions] = useState<WeeklyPredictions>(() => {
    const initRound = getCurrentActiveRound(dataset.fixtures);
    const all = loadAllPredictions();
    return all[initRound] || {};
  });

  // Results overrides loaded from localStorage
  const [resultsOverrides] = useState(() => loadMatchResultsOverrides());

  // Reload predictions when round changes
  useEffect(() => {
    const all = loadAllPredictions();
    setPredictions(all[selectedRound] || {});
  }, [selectedRound]);

  // Handle user pick selection and immediately persist to localStorage
  const handlePredict = (fixtureId: string, pick: PredictionType, isLocked: boolean) => {
    if (isLocked) return;
    const isRemoving = predictions[fixtureId] === pick;
    const updated = {
      ...predictions,
      [fixtureId]: isRemoving ? ('' as unknown as PredictionType) : pick,
    };
    // Remove empty keys
    if (!updated[fixtureId]) {
      delete updated[fixtureId];
    }
    setPredictions(updated);
    saveWeeklyPredictions(selectedRound, updated);
  };

  const currentRoundFixtures = useMemo(() => {
    return dataset.fixtures.filter((f) => f.round === selectedRound);
  }, [dataset.fixtures, selectedRound]);

  // Teams map lookup
  const teamsMap = useMemo(() => {
    const map = new Map<string, string>();
    dataset.teams.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [dataset.teams]);

  // Precompute mathematical probabilities map for current fixtures
  const probabilitiesMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateMatchProbabilities>>();
    currentRoundFixtures.forEach((f) => {
      map.set(f.id, calculateMatchProbabilities(f, dataset.players, dataset.teams));
    });
    return map;
  }, [currentRoundFixtures, dataset.players, dataset.teams]);

  // Fill coupon with purely mathematical model suggestions
  const handleAutoFillMathematicalPredictions = () => {
    const updated: WeeklyPredictions = { ...predictions };
    currentRoundFixtures.forEach((f) => {
      const isLocked = f.status === 'live';
      if (!isLocked) {
        const probs = probabilitiesMap.get(f.id);
        if (probs) {
          updated[f.id] = probs.suggestedPick;
        }
      }
    });

    setPredictions(updated);
    saveWeeklyPredictions(selectedRound, updated);
  };

  // Reset predictions for current round
  const handleResetPredictions = () => {
    setPredictions({});
    saveWeeklyPredictions(selectedRound, {});
  };

  // Determine actual outcome for a match if finished
  const getActualOutcome = (f: Fixture): PredictionType | null => {
    const override = resultsOverrides[f.id];
    const score = override?.score || f.score;
    const isFin = override?.status === 'finished' || f.status === 'finished';

    if (!isFin || !score) return null;
    if (score.home > score.away) return '1';
    if (score.home === score.away) return 'X';
    return '2';
  };

  // Group fixtures by exact chronological day and time
  const fixturesByDay = useMemo(() => {
    // Sort all fixtures for the round chronologically by kickoff time
    const sorted = [...currentRoundFixtures].sort((a, b) => {
      return (a.kickoff || '').localeCompare(b.kickoff || '');
    });

    const dayGroupsMap = new Map<string, { label: string; dateStr: string; fixtures: Fixture[] }>();

    sorted.forEach((fixture) => {
      let dayKey = 'Tarih Belirlenecek';
      let dayLabel = `${selectedRound}. Hafta Karşılaşmaları`;
      let dateStr = '';

      if (fixture.kickoff && fixture.kickoff.includes('T')) {
        try {
          const date = new Date(fixture.kickoff);
          const day = date.getDate();
          const monthNames = ['OCA', 'ŞUB', 'MAR', 'NİS', 'MAY', 'HAZ', 'TEM', 'AĞU', 'EYL', 'EKİ', 'KAS', 'ARA'];
          const dayNames = ['PAZ', 'PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT'];
          const dayFull = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

          const mShort = monthNames[date.getMonth()];
          const dShort = dayNames[date.getDay()];
          const dFull = dayFull[date.getDay()];

          const dd = String(day).padStart(2, '0');
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const yyyy = date.getFullYear();

          dayKey = `${yyyy}-${mm}-${dd}`;
          dayLabel = `${day} ${mShort} ${dShort}`;
          dateStr = `${dd}-${mm}-${yyyy} (${dFull})`;
        } catch {
          // fallback
        }
      }

      if (!dayGroupsMap.has(dayKey)) {
        dayGroupsMap.set(dayKey, { label: dayLabel, dateStr, fixtures: [] });
      }
      dayGroupsMap.get(dayKey)!.fixtures.push(fixture);
    });

    return Array.from(dayGroupsMap.values());
  }, [currentRoundFixtures, selectedRound]);

  const formatMatchTime = (kickoff?: string) => {
    if (!kickoff || !kickoff.includes('T')) return '19:00';
    try {
      const d = new Date(kickoff);
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    } catch {
      return '19:00';
    }
  };

  // Calculate user accuracy and Nostradamus points
  const stats = useMemo(() => {
    let correctCount = 0;
    let totalScore = 0;
    let finishedCount = 0;

    currentRoundFixtures.forEach((f) => {
      const outcome = getActualOutcome(f);
      const userPick = predictions[f.id];
      if (outcome !== null) {
        finishedCount++;
        if (userPick && userPick === outcome) {
          correctCount++;
          totalScore += 10;
        }
      }
    });

    const accuracyStr = `${correctCount}/${currentRoundFixtures.length || 9}`;
    return {
      accuracy: accuracyStr,
      score: totalScore,
      correct: correctCount,
      totalMatches: currentRoundFixtures.length || 9,
      finishedCount,
    };
  }, [currentRoundFixtures, predictions, resultsOverrides]);

  return (
    <div id="nostradamus-page-container" className="w-full space-y-4 animate-fadeIn">
      {/* Top Banner: Tahminlerini Yap, Puanları Topla! */}
      <div
        id="nostradamus-hero-banner"
        className="sofa-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-amber-500/20 bg-gradient-to-r from-[#121824] via-[#101726] to-[#0d1420]"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-black flex items-center justify-center font-black shadow-md">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-[var(--text-primary)]">
                Tahminlerini Yap, Puanları Topla!
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Süper Lig maçlarının sonuçlarını tahmin et, kuponunu tamamla ve Nostradamus puanlarını topla.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {/* Week Selector Dropdown */}
          <div className="h-[34px] flex items-center gap-1.5 bg-[var(--bg-surface)] px-2.5 rounded border border-[var(--border)] text-xs font-bold">
            <Calendar className="w-3.5 h-3.5 text-[var(--color-brand)]" />
            <span>Maç Haftası</span>
            <select
              id="nostradamus-week-select"
              value={selectedRound}
              onChange={(e) => setSelectedRound(Number(e.target.value))}
              className="bg-transparent text-[var(--color-brand)] font-mono font-black focus:outline-none cursor-pointer ml-1"
            >
              {Array.from({ length: 34 }, (_, i) => i + 1).map((r) => (
                <option key={r} value={r} className="bg-[#121824] text-white">
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Mathematical Auto-Fill Button */}
          <button
            id="nostradamus-auto-fill-btn"
            onClick={handleAutoFillMathematicalPredictions}
            title="Kadro güçleri ve ev avantajı algoritmalarına dayalı matematiksel tahminleri kupona doldur"
            className="h-[34px] btn-sofa text-xs flex items-center gap-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md transition-all"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Matematiksel Doldur</span>
          </button>

          {/* Reset Predictions Button */}
          <button
            id="nostradamus-reset-btn"
            onClick={handleResetPredictions}
            title="Bu haftaki tahminleri sıfırla"
            className="h-[34px] w-[34px] flex items-center justify-center rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-strong)] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* How to Play Button */}
          <button
            id="nostradamus-how-to-play-btn"
            onClick={() => setIsHowToPlayOpen(true)}
            className="h-[34px] btn-sofa btn-sofa-secondary text-xs flex items-center gap-1.5 px-3"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Nasıl Oynanır?</span>
          </button>
        </div>
      </div>

      {/* 3 Quick Metric Cards */}
      <div id="nostradamus-stats-bar" className="grid grid-cols-3 gap-3 text-center max-w-2xl mx-auto w-full">
        {/* İSABET */}
        <div id="nostradamus-stat-accuracy" className="sofa-card p-3 space-y-0.5">
          <div className="text-[10px] font-mono font-bold uppercase text-[var(--text-muted)] tracking-wider">
            İSABET
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[var(--text-primary)]">
            {stats.accuracy}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] font-mono">
            {stats.finishedCount > 0 ? `%${Math.round((stats.correct / stats.finishedCount) * 100)} Başarı` : 'Henüz Başlamadı'}
          </div>
        </div>

        {/* NOSTRADAMUS PUANI */}
        <div id="nostradamus-stat-points" className="sofa-card p-3 space-y-0.5 border-amber-500/20 bg-amber-950/10">
          <div className="text-[10px] font-mono font-bold uppercase text-amber-400 tracking-wider">
            NOSTRADAMUS PUANI
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-400">
            +{stats.score}
          </div>
          <div className="text-[10px] text-amber-400/80">Kazanılan Puan</div>
        </div>

        {/* DOĞRU TAHMİN */}
        <div id="nostradamus-stat-correct" className="sofa-card p-3 space-y-0.5 border-emerald-500/20 bg-emerald-950/10">
          <div className="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-wider">
            DOĞRU
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
            {stats.correct}
          </div>
          <div className="text-[10px] text-emerald-400/80">Tam İsabet</div>
        </div>
      </div>

      {/* Mathematical Simulation Model Notice Banner */}
      <div
        id="nostradamus-math-disclaimer-banner"
        className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30 flex items-start gap-3 text-xs leading-relaxed text-slate-300 shadow-sm max-w-2xl mx-auto w-full"
      >
        <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-indigo-500/30">
          <Calculator className="w-3.5 h-3.5" />
        </div>
        <div>
          <strong className="text-indigo-300 font-bold block text-xs mb-0.5">
            📐 Matematiksel Simülasyon & İstatistiksel Olasılık Modeli:
          </strong>
          <span className="text-[11px] text-slate-300 leading-normal">
            Aşağıdaki maç yüzdeleri ve öneriler; kulüplerin güncel kadro piyasa değerleri, oyuncu puan projeksiyonları ve Türkiye Süper Lig ev sahibi avantajı katsayısı (+%15) kullanılarak türetilmiş <strong>saf matematiksel istatistik hesaplamalarıdır</strong>. Kesinlik veya sonuç taahhüdü içermez.
          </span>
        </div>
      </div>

      {/* Match Cards Grouped by Match Day */}
      <div id="nostradamus-fixtures-container" className="space-y-4 max-w-2xl mx-auto w-full">
        {fixturesByDay.map((group) => (
          <div key={group.label} className="space-y-2">
            {/* Day Header - Centered & Aligned with Cards */}
            <div className="flex items-center gap-1.5 text-xs font-mono font-extrabold text-[var(--color-brand)] px-1 pt-1 uppercase">
              <Calendar className="w-3.5 h-3.5" />
              <span>{group.label}</span>
            </div>

            {/* Match Cards Single Column List */}
            <div className="grid grid-cols-1 gap-3 w-full">
              {group.fixtures.map((fixture) => {
                const homeName = teamsMap.get(fixture.home_team_id) || fixture.home_team_id;
                const awayName = teamsMap.get(fixture.away_team_id) || fixture.away_team_id;
                const homeBrand = getTeamBranding(fixture.home_team_id);
                const awayBrand = getTeamBranding(fixture.away_team_id);

                const override = resultsOverrides[fixture.id];
                const isFinished = override?.status === 'finished' || fixture.status === 'finished';
                const currentScore = override?.score || fixture.score;
                // Live match simulation for Week 1 matches
                const isLive = override?.status === 'live' || ['2026-27-w01-03', '2026-27-w01-04'].includes(fixture.id);
                const isLocked = isFinished || isLive;

                const actualOutcome = getActualOutcome(fixture);
                const userPick = predictions[fixture.id];
                const isCorrect = isFinished && userPick && userPick === actualOutcome;
                const isWrong = isFinished && userPick && userPick !== actualOutcome;
                const probs = probabilitiesMap.get(fixture.id);

                return (
                  <div
                    key={fixture.id}
                    id={`nostradamus-card-${fixture.id}`}
                    className={`sofa-card p-3.5 flex flex-col justify-between space-y-3 transition-all ${
                      isCorrect
                        ? 'border-emerald-500/40 bg-emerald-950/10'
                        : isWrong
                        ? 'border-rose-500/30'
                        : 'hover:border-[var(--border-strong)]'
                    }`}
                  >
                    {/* Card Top: Teams & Match Status */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] flex-shrink-0"
                          style={{
                            background: homeBrand.primaryColor,
                            color: homeBrand.textColor,
                            border: `1px solid ${homeBrand.secondaryColor}`,
                          }}
                        >
                          {homeBrand.code}
                        </span>
                        <span className="font-bold text-xs text-[var(--text-primary)] truncate">
                          {homeName}
                        </span>
                      </div>

                      {/* Center Score / Kickoff Badge */}
                      <div className="flex flex-col items-center justify-center px-2 flex-shrink-0">
                        {isFinished && currentScore ? (
                          <div className="flex flex-col items-center">
                            <span className="font-mono font-black text-sm text-[var(--color-brand)] bg-[var(--bg-surface)] px-2 py-0.5 rounded border border-[var(--border)]">
                              {currentScore.home} - {currentScore.away}
                            </span>
                            <span className="text-[9px] font-mono text-emerald-400 uppercase mt-0.5">MS</span>
                          </div>
                        ) : isLive ? (
                          <div className="flex flex-col items-center">
                            <span className="font-mono font-bold text-xs text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30 animate-pulse">
                              21:30 CANLI
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="font-mono text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-surface)] px-2 py-0.5 rounded border border-[var(--border)]">
                              {formatMatchTime(fixture.kickoff)}
                            </span>
                            <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase mt-0.5">VS</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 flex-1 min-w-0 text-right">
                        <span className="font-bold text-xs text-[var(--text-primary)] truncate">
                          {awayName}
                        </span>
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] flex-shrink-0"
                          style={{
                            background: awayBrand.primaryColor,
                            color: awayBrand.textColor,
                            border: `1px solid ${awayBrand.secondaryColor}`,
                          }}
                        >
                          {awayBrand.code}
                        </span>
                      </div>
                    </div>

                    {/* Mathematical Probabilities & Model Recommendation */}
                    {probs && (
                      <div className="w-full bg-[#0d121c] rounded-lg p-2 border border-[#1e283b] space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-emerald-400 font-bold">1: %{probs.homeWinProb}</span>
                          <span className="text-amber-400 font-bold">X: %{probs.drawProb}</span>
                          <span className="text-sky-400 font-bold">2: %{probs.awayWinProb}</span>
                        </div>
                        {/* 3-Way Colored Bar */}
                        <div className="h-1.5 w-full bg-[#182030] rounded-full flex overflow-hidden">
                          <div
                            style={{ width: `${probs.homeWinProb}%` }}
                            className="bg-emerald-500 h-full transition-all"
                            title={`MS 1 %${probs.homeWinProb}`}
                          />
                          <div
                            style={{ width: `${probs.drawProb}%` }}
                            className="bg-amber-400 h-full transition-all"
                            title={`X %${probs.drawProb}`}
                          />
                          <div
                            style={{ width: `${probs.awayWinProb}%` }}
                            className="bg-sky-400 h-full transition-all"
                            title={`MS 2 %${probs.awayWinProb}`}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] pt-0.5">
                          <span className="text-[var(--text-muted)] flex items-center gap-1 truncate">
                            <Calculator className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                            <span>Matematiksel Model:</span>
                            <strong className="text-white font-bold">{probs.suggestedLabel}</strong>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Prediction Buttons (Kupon Stili: MS 1, X, MS 2 with Distinct Color Coding) */}
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { type: '1' as const, label: 'MS 1', sub: 'Ev Sahibi' },
                          { type: 'X' as const, label: 'X', sub: 'Beraberlik' },
                          { type: '2' as const, label: 'MS 2', sub: 'Deplasman' },
                        ].map(({ type, label, sub }) => {
                          const isUserPick = userPick === type;
                          const isActualOutcome = actualOutcome === type;

                          let btnStyle =
                            'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-white';
                          let badge = null;

                          if (isFinished) {
                            if (isUserPick && isActualOutcome) {
                              // User's correct pick -> Solid Emerald
                              btnStyle =
                                'bg-emerald-500 text-black border-emerald-400 font-black shadow-lg ring-1 ring-emerald-300';
                              badge = (
                                <span className="text-[8px] font-black uppercase tracking-wider bg-black/40 text-emerald-200 px-1.5 py-0.5 rounded mt-0.5">
                                  ✓ İsabet
                                </span>
                              );
                            } else if (isUserPick && !isActualOutcome) {
                              // User's wrong pick -> Distinct Rose/Red
                              btnStyle =
                                'bg-rose-950/80 text-rose-300 border-2 border-rose-500 font-bold shadow-sm';
                              badge = (
                                <span className="text-[8px] font-black uppercase tracking-wider bg-rose-900 text-rose-100 px-1.5 py-0.5 rounded mt-0.5">
                                  ✗ Seçimin
                                </span>
                              );
                            } else if (!isUserPick && isActualOutcome) {
                              // Actual match winning outcome -> Distinct Amber/Gold
                              btnStyle =
                                'bg-amber-500/20 text-amber-300 border-2 border-amber-400 font-black shadow-md';
                              badge = (
                                <span className="text-[8px] font-black uppercase tracking-wider bg-amber-400 text-black px-1.5 py-0.5 rounded mt-0.5">
                                  ★ Maç Sonucu
                                </span>
                              );
                            }
                          } else {
                            // Upcoming / Live match
                            if (isUserPick) {
                              btnStyle =
                                'bg-[var(--color-brand)] text-black border-[var(--color-brand)] font-black shadow-md';
                              badge = (
                                <span className="text-[8px] font-black uppercase tracking-wider bg-black/25 text-black px-1.5 py-0.5 rounded mt-0.5">
                                  Kuponda
                                </span>
                              );
                            }
                          }

                          return (
                            <button
                              key={type}
                              id={`pick-btn-${fixture.id}-${type}`}
                              onClick={() => handlePredict(fixture.id, type, isLocked)}
                              disabled={isLocked}
                              className={`py-2 px-1 rounded flex flex-col items-center justify-center border transition-all ${btnStyle} ${
                                isLocked ? 'cursor-default' : 'cursor-pointer'
                              }`}
                            >
                              <span className="text-xs font-mono font-black">{label}</span>
                              <span className="text-[9px] uppercase tracking-wider opacity-85">{sub}</span>
                              {badge}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Card Bottom: Status & Match Details Action */}
                    <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs">
                      {isFinished ? (
                        <div className="flex items-center gap-1.5 font-bold">
                          {isCorrect ? (
                            <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Doğru Tahmin (+10 Puan)</span>
                            </span>
                          ) : isWrong ? (
                            <span className="text-rose-400 flex items-center gap-1 text-[11px]">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Yanlış Tahmin</span>
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)] text-[11px]">Tahmin Yapılmadı</span>
                          )}
                        </div>
                      ) : isLive ? (
                        <div className="flex items-center gap-1 text-amber-400 text-[11px] font-bold">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Kilitli (Maç Oynanıyor)</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-[var(--text-muted)] font-mono">
                          {userPick ? (
                            <span className="text-[var(--color-brand)] font-bold">✓ Kupona Eklendi</span>
                          ) : (
                            <span>Tahminini seç</span>
                          )}
                        </div>
                      )}

                      {/* Open Match Details Button */}
                      {onSelectFixture && isFinished && (
                        <button
                          id={`nostradamus-detail-btn-${fixture.id}`}
                          onClick={() => onSelectFixture(fixture)}
                          className="text-[11px] font-bold text-[var(--color-brand)] hover:underline flex items-center gap-0.5 ml-auto"
                        >
                          <span>DETAYLARI AÇ</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* "Nasıl Oynanır?" Modal Dialog (Rendered in Document Body via Portal for true full viewport coverage & centering) */}
      {isHowToPlayOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            id="nostradamus-modal-overlay"
            onClick={() => setIsHowToPlayOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          >
            <div
              id="nostradamus-modal-content"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-5 sm:p-6 space-y-4 relative border border-amber-500/40 shadow-2xl rounded-2xl bg-[#121824] text-[var(--text-primary)]"
            >
              <button
                id="nostradamus-modal-close-btn"
                onClick={() => setIsHowToPlayOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-[#1a2233] border border-[#2a364f] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 pb-3 border-b border-[#222c3f]">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-black flex items-center justify-center font-black text-sm shadow">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Nostradamus Tahmin Oyunu
                  </h3>
                  <span className="text-[11px] text-amber-400 font-mono font-bold">Nasıl Oynanır & Puanlama</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs leading-relaxed text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0e141f] border border-[#222c3f]">
                  <Target className="w-5 h-5 text-[var(--color-brand)] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block text-xs font-bold mb-0.5">1. Maç Sonucunu Seç (1 - X - 2):</strong>
                    Haftalık maç kartlarındaki Ev Sahibi (MS 1), Beraberlik (X) veya Deplasman (MS 2) butonuna tıklayarak tahminini kuponuna ekle.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0e141f] border border-[#222c3f]">
                  <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block text-xs font-bold mb-0.5">2. Başlama Düdüğünde Kilitlenir:</strong>
                    Karşılaşma başladığı anda ilgili maçın tahminleri kilitlenir ve değiştirilemez.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0e141f] border border-[#222c3f]">
                  <Award className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block text-xs font-bold mb-0.5">3. Puanları Topla:</strong>
                    Tutan her doğru maç tahmini için kuponuna <strong className="text-emerald-400">+10 Nostradamus Puanı</strong> eklenir. Tüm seçimler cihazında otomatik saklanır.
                  </div>
                </div>
              </div>

              <button
                id="nostradamus-modal-submit-btn"
                onClick={() => setIsHowToPlayOpen(false)}
                className="w-full btn-sofa btn-sofa-primary text-xs py-2.5 font-bold shadow-lg mt-2"
              >
                Anladım, Tahmin Kuponumu Tamamla
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
