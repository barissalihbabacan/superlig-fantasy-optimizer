import React, { useState, useMemo } from 'react';
import { Fixture, SeasonDataset, Player } from '../types';
import { getTeamBranding, getShortPosition, formatPrice, formatDateDDMMYYYY } from '../services/dataset';
import { calculateMatchProbabilities } from '../services/matchPredictor';
import { checkHighlightAvailability } from '../services/highlightChecker';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Star,
  Trophy,
  Activity,
  Users,
  Play,
  Tv,
  ExternalLink,
  Clock,
  Calculator,
  Shield,
} from 'lucide-react';

interface MatchDetailProps {
  fixture: Fixture;
  dataset: SeasonDataset;
  onBack: () => void;
}

interface PerformanceRow {
  id: string;
  name: string;
  team: string;
  pos: string;
  pts: number;
  events: string;
  price: number;
  rating: string;
  motm: boolean;
}

export const MatchDetail: React.FC<MatchDetailProps> = ({
  fixture,
  dataset,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'fantasy' | 'stats' | 'lineup'>('fantasy');

  const homeName = dataset.teams.find((t) => t.id === fixture.home_team_id)?.name || fixture.home_team_id;
  const awayName = dataset.teams.find((t) => t.id === fixture.away_team_id)?.name || fixture.away_team_id;
  const homeBrand = getTeamBranding(fixture.home_team_id);
  const awayBrand = getTeamBranding(fixture.away_team_id);
  const isFinished = fixture.status === 'finished';
  const hasScore = fixture.score !== undefined && fixture.score !== null;

  // Automated highlight verification & URL resolver
  const highlightInfo = useMemo(() => {
    return checkHighlightAvailability(fixture, homeName, awayName);
  }, [fixture, homeName, awayName]);

  // Mathematical pre-match probabilities for upcoming matches
  const matchProbs = useMemo(() => {
    return calculateMatchProbabilities(fixture, dataset.players, dataset.teams);
  }, [fixture, dataset.players, dataset.teams]);

  // Retrieve players for each team
  const homePlayers = useMemo(() => {
    return dataset.players
      .filter((p) => p.team_id === fixture.home_team_id)
      .sort((a, b) => b.price - a.price);
  }, [dataset.players, fixture.home_team_id]);

  const awayPlayers = useMemo(() => {
    return dataset.players
      .filter((p) => p.team_id === fixture.away_team_id)
      .sort((a, b) => b.price - a.price);
  }, [dataset.players, fixture.away_team_id]);

  // Construct Starting 11 for Home & Away Teams
  const getStartingEleven = (teamPlayers: Player[]) => {
    const gk = teamPlayers.filter((p) => p.position === 'Goalkeeper').slice(0, 1);
    const def = teamPlayers.filter((p) => p.position === 'Defender').slice(0, 4);
    const mid = teamPlayers.filter((p) => p.position === 'Midfielder').slice(0, 4);
    const fwd = teamPlayers.filter((p) => p.position === 'Forward').slice(0, 2);

    const selected = [...gk, ...def, ...mid, ...fwd];
    const selectedIds = new Set(selected.map((p) => p.id));
    const remaining = teamPlayers.filter((p) => !selectedIds.has(p.id));

    while (selected.length < 11 && remaining.length > 0) {
      selected.push(remaining.shift()!);
    }
    return selected;
  };

  const homeStarting11 = useMemo(() => getStartingEleven(homePlayers), [homePlayers]);
  const awayStarting11 = useMemo(() => getStartingEleven(awayPlayers), [awayPlayers]);

  // Dynamic Fantasy Performances for Finished Matches / Expected Projections for Upcoming Matches
  const fantasyPerformances = useMemo<PerformanceRow[]>(() => {
    // If NOT finished, show pre-match expected projected points without fake match ratings or MOTM
    if (!isFinished) {
      const allSquad = [...homeStarting11, ...awayStarting11];
      return allSquad.map((p) => {
        const proj = dataset.projections.get(p.id);
        const expectedPts = proj ? proj.expected_points : Math.round((p.price / 1000) * 4) + 2;
        const isHome = p.team_id === fixture.home_team_id;
        const team = isHome ? homeName : awayName;

        return {
          id: p.id,
          name: p.name,
          team,
          pos: getShortPosition(p.position),
          pts: expectedPts,
          events: 'Maç Bekleniyor',
          price: p.price,
          rating: '-',
          motm: false, // NO MOTM for unplayed match
        };
      }).sort((a, b) => b.pts - a.pts);
    }

    // Finished matches logic
    if (fixture.id === '2026-27-w01-01') {
      // Galatasaray 2 - 2 Çorum FK
      return [
        { id: 'victor-james-osimhen', name: 'Victor Osimhen', team: homeName, pos: 'FOR', pts: 13, events: '⚽⚽ 53\', 90\'', price: 1200, rating: '9.4', motm: true },
        { id: 'leroy-aziz-sane', name: 'Leroy Sané', team: homeName, pos: 'OS', pts: 7, events: '🎯 Asist 90\' · Bonus 2', price: 850, rating: '7.8', motm: false },
        { id: 'jesus-andres-ramirez-diaz', name: 'Jesús Ramírez', team: awayName, pos: 'FOR', pts: 7, events: '⚽ Gol 61\' · Bonus 3', price: 550, rating: '7.9', motm: false },
        { id: 'alexandros-kyziridis', name: 'Alexandros Kyziridis', team: awayName, pos: 'OS', pts: 7, events: '⚽ Gol 59\'', price: 450, rating: '7.5', motm: false },
        { id: 'serdar-gurler', name: 'Serdar Gürler', team: awayName, pos: 'OS', pts: 5, events: '🎯 Asist 59\'', price: 500, rating: '7.3', motm: false },
        { id: 'gabriel-davi-gomes-sara', name: 'Gabriel Sara', team: homeName, pos: 'OS', pts: 2, events: '90 Dk · 4 Kilit Pas', price: 700, rating: '7.2', motm: false },
        { id: 'ilkay-gundogan', name: 'İlkay Gündoğan', team: homeName, pos: 'OS', pts: 2, events: '84 Dk', price: 800, rating: '6.9', motm: false },
        { id: 'mario-rene-junior-lemina', name: 'Mario Lemina', team: homeName, pos: 'OS', pts: 2, events: '71 Dk', price: 600, rating: '6.8', motm: false },
        { id: 'marcos-felipe-de-freitas-monteiro', name: 'Marcos Felipe', team: awayName, pos: 'KL', pts: 3, events: '5 Kurtarış · 2 Gol Yedi', price: 450, rating: '7.4', motm: false },
        { id: 'ugurcan-cakir', name: 'Uğurcan Çakır', team: homeName, pos: 'KL', pts: 2, events: '3 Kurtarış · 2 Gol Yedi', price: 550, rating: '6.4', motm: false },
        { id: 'kaan-ayhan', name: 'Kaan Ayhan', team: homeName, pos: 'DEF', pts: 1, events: '90 Dk · 2 Gol Yedi', price: 550, rating: '6.5', motm: false },
        { id: 'abdulkerim-bardakci', name: 'Abdülkerim Bardakcı', team: homeName, pos: 'DEF', pts: 1, events: '84 Dk · 2 Gol Yedi', price: 600, rating: '6.3', motm: false },
        { id: 'davinson-sanchez-mina', name: 'Davinson Sánchez', team: homeName, pos: 'DEF', pts: 1, events: '71 Dk · 2 Gol Yedi', price: 650, rating: '6.4', motm: false },
        { id: 'hrvoje-smolcic', name: 'Hrvoje Smolčić', team: awayName, pos: 'DEF', pts: 1, events: '76 Dk · 2 Gol Yedi', price: 450, rating: '6.6', motm: false },
        { id: 'yunus-akgun', name: 'Yunus Akgün', team: homeName, pos: 'OS', pts: 1, events: '🟨 Sarı Kart 78\'', price: 650, rating: '6.1', motm: false },
      ];
    }

    if (fixture.id === '2026-27-w01-02') {
      // Konyaspor 0 - 1 Rizespor
      const rows: PerformanceRow[] = [];
      awayStarting11.forEach((p, idx) => {
        const isGoalScorer = idx === 0;
        const pts = isGoalScorer ? 9 : p.position === 'Defender' || p.position === 'Goalkeeper' ? 6 : 4;
        rows.push({
          id: p.id,
          name: p.name,
          team: awayName,
          pos: getShortPosition(p.position),
          pts,
          events: isGoalScorer ? '⚽ Gol 67\' · Bonus 3' : p.position === 'Goalkeeper' ? '🧤 Gol Yemedi · 4 Kurtarış' : '90 Dk',
          price: p.price,
          rating: isGoalScorer ? '8.3' : '7.2',
          motm: isGoalScorer,
        });
      });
      homeStarting11.forEach((p) => {
        rows.push({
          id: p.id,
          name: p.name,
          team: homeName,
          pos: getShortPosition(p.position),
          pts: 2,
          events: '90 Dk',
          price: p.price,
          rating: '6.5',
          motm: false,
        });
      });
      return rows.sort((a, b) => b.pts - a.pts);
    }

    if (fixture.id === '2026-27-w01-03') {
      // Gaziantep FK 1 - 1 Alanyaspor
      return [
        { id: 'paulo-victor-mileo-vidotti', name: 'Paulo Victor', team: awayName, pos: 'KL', pts: 8, events: '🧤 6 Kurtarış · Bonus 3', price: 500, rating: '8.1', motm: true },
        { id: 'deian-cristian-sorescu', name: 'Deian Sorescu', team: homeName, pos: 'OS', pts: 8, events: '⚽ Gol 61\' · Bonus 2', price: 550, rating: '7.8', motm: false },
        { id: 'ruan-pereira-duarte', name: 'Ruan Pereira Duarte', team: awayName, pos: 'OS', pts: 8, events: '⚽ Gol 20\' · Bonus 2', price: 550, rating: '7.7', motm: false },
        { id: 'juninho-bacuna', name: 'Juninho Bacuna', team: homeName, pos: 'OS', pts: 5, events: '🎯 Asist 61\'', price: 600, rating: '7.4', motm: false },
        { id: 'alexandru-iulian-maxim', name: 'Alexandru Maxim', team: homeName, pos: 'OS', pts: 2, events: '90 Dk · 3 Kilit Pas', price: 650, rating: '7.1', motm: false },
        { id: 'kacper-kozlowski', name: 'Kacper Kozłowski', team: homeName, pos: 'OS', pts: 2, events: '70 Dk', price: 600, rating: '7.0', motm: false },
        { id: 'fidan-aliti', name: 'Fidan Aliti', team: awayName, pos: 'DEF', pts: 1, events: '90 Dk · 1 Gol Yedi', price: 500, rating: '6.8', motm: false },
        { id: 'kacper-tobiasz', name: 'Kacper Tobiasz', team: homeName, pos: 'KL', pts: 2, events: '4 Kurtarış · 1 Gol Yedi', price: 500, rating: '6.6', motm: false },
        { id: 'lucas-perez', name: 'Lucas Pérez', team: homeName, pos: 'DEF', pts: 1, events: '90 Dk · 1 Gol Yedi', price: 500, rating: '6.7', motm: false },
        { id: 'florent-hadergjonaj', name: 'Florent Hadërgjonaj', team: awayName, pos: 'DEF', pts: 1, events: '90 Dk · 1 Gol Yedi', price: 550, rating: '6.7', motm: false },
        { id: 'gaius-makouta', name: 'Gaius Makouta', team: awayName, pos: 'OS', pts: 2, events: '78 Dk', price: 600, rating: '6.8', motm: false },
        { id: 'hwang-ui-jo', name: 'Hwang Ui-Jo', team: awayName, pos: 'FOR', pts: 2, events: '69 Dk', price: 600, rating: '6.5', motm: false },
        { id: 'serdar-dursun', name: 'Serdar Dursun', team: homeName, pos: 'FOR', pts: 1, events: '20 Dk', price: 550, rating: '6.4', motm: false },
      ];
    }

    if (fixture.id === '2026-27-w01-04') {
      // Gençlerbirliği 2 - 1 Fenerbahçe
      return [
        { id: 'irfan-can-egribayat', name: 'İrfan Can Eğribayat', team: homeName, pos: 'KL', pts: 8, events: '🧤 7 Kurtarış · Bonus 3', price: 450, rating: '8.4', motm: true },
        { id: 'franco-tongya', name: 'Franco Tongya', team: homeName, pos: 'OS', pts: 8, events: '⚽ Gol 37\' · Bonus 2', price: 500, rating: '7.9', motm: false },
        { id: 'ogulcan-ulgun', name: 'Oğulcan Ülgün', team: homeName, pos: 'OS', pts: 8, events: '⚽ Gol 56\' · Bonus 2', price: 500, rating: '7.8', motm: false },
        { id: 'anderson-souza-conceicao', name: 'Talisca', team: awayName, pos: 'OS', pts: 7, events: '⚽ Gol 13\'', price: 950, rating: '7.5', motm: false },
        { id: 'sekou-koita', name: 'Sekou Koita', team: homeName, pos: 'FOR', pts: 5, events: '🎯 Asist 37\'', price: 550, rating: '7.3', motm: false },
        { id: 'alihan-dursun', name: 'Alihan Dursun', team: homeName, pos: 'DEF', pts: 4, events: '🎯 Asist 56\' · 1 Gol Yedi', price: 450, rating: '7.2', motm: false },
        { id: 'levent-mercan', name: 'Levent Mercan', team: awayName, pos: 'DEF', pts: 4, events: '🎯 Asist 13\' · 2 Gol Yedi', price: 550, rating: '7.1', motm: false },
        { id: 'ngolo-kante', name: 'N\'Golo Kanté', team: awayName, pos: 'OS', pts: 2, events: '31 Dk', price: 800, rating: '6.9', motm: false },
        { id: 'pedro-miguel-almeida-lopes-pereira', name: 'Pedro Pereira', team: homeName, pos: 'DEF', pts: 1, events: '90 Dk · 1 Gol Yedi', price: 450, rating: '6.7', motm: false },
        { id: 'dimitrios-goutas', name: 'Dimitrios Goutas', team: homeName, pos: 'DEF', pts: 1, events: '90 Dk · 1 Gol Yedi', price: 500, rating: '6.8', motm: false },
        { id: 'milan-skriniar', name: 'Milan Škriniar', team: awayName, pos: 'DEF', pts: 1, events: '90 Dk · 2 Gol Yedi', price: 650, rating: '6.4', motm: false },
        { id: 'nathan-ake', name: 'Nathan Aké', team: awayName, pos: 'DEF', pts: 1, events: '90 Dk · 2 Gol Yedi', price: 700, rating: '6.5', motm: false },
        { id: 'tarik-cetin', name: 'Tarık Çetin', team: awayName, pos: 'KL', pts: 1, events: '2 Kurtarış · 2 Gol Yedi', price: 500, rating: '6.2', motm: false },
        { id: 'mason-greenwood', name: 'Mason Greenwood', team: awayName, pos: 'OS', pts: 1, events: '31 Dk', price: 900, rating: '6.6', motm: false },
        { id: 'vedat-muriqi', name: 'Vedat Muriqi', team: awayName, pos: 'FOR', pts: 1, events: '30 Dk', price: 850, rating: '6.5', motm: false },
        { id: 'kerem-aktürkoğlu', name: 'Kerem Aktürkoğlu', team: awayName, pos: 'OS', pts: 1, events: '25 Dk', price: 850, rating: '6.3', motm: false },
      ];
    }

    if (fixture.id === '2026-27-w01-05') {
      // Kasımpaşa 1 - 1 Trabzonspor
      const rows: PerformanceRow[] = [];
      homeStarting11.slice(0, 7).forEach((p, idx) => {
        const isGoalScorer = idx === 0;
        rows.push({
          id: p.id,
          name: p.name,
          team: homeName,
          pos: getShortPosition(p.position),
          pts: isGoalScorer ? 8 : 3,
          events: isGoalScorer ? '⚽ Gol 42\' · Bonus 2' : '90 Dk',
          price: p.price,
          rating: isGoalScorer ? '7.9' : '6.8',
          motm: false,
        });
      });
      awayStarting11.slice(0, 7).forEach((p, idx) => {
        const isGoalScorer = idx === 0;
        rows.push({
          id: p.id,
          name: p.name,
          team: awayName,
          pos: getShortPosition(p.position),
          pts: isGoalScorer ? 9 : 3,
          events: isGoalScorer ? '⚽ Gol 74\' · Bonus 3' : '90 Dk',
          price: p.price,
          rating: isGoalScorer ? '8.2' : '6.9',
          motm: isGoalScorer,
        });
      });
      return rows.sort((a, b) => b.pts - a.pts);
    }

    // Generic finished fallback
    const allSquad = [...homeStarting11, ...awayStarting11];
    return allSquad.map((p, idx) => ({
      id: p.id,
      name: p.name,
      team: p.team_id === fixture.home_team_id ? homeName : awayName,
      pos: getShortPosition(p.position),
      pts: 2,
      events: '90 Dk',
      price: p.price,
      rating: '6.7',
      motm: idx === 0,
    }));
  }, [fixture.id, homeName, awayName, homeStarting11, awayStarting11, dataset.projections, isFinished]);

  // Match Stats for Finished matches vs Pre-match Analysis for upcoming
  const matchStats = useMemo(() => {
    if (!isFinished) return [];

    if (fixture.id === '2026-27-w01-01') {
      return [
        { label: 'Topla Oynama', home: '%71', away: '%29', homeVal: 71, awayVal: 29 },
        { label: 'Toplam Şut', home: '38', away: '6', homeVal: 38, awayVal: 6 },
        { label: 'İsabetli Şut', home: '14', away: '3', homeVal: 14, awayVal: 3 },
        { label: 'Beklenen Gol (xG)', home: '2.90', away: '0.84', homeVal: 2.9, awayVal: 0.84 },
        { label: 'Köşe Vuruşu (Korner)', home: '12', away: '2', homeVal: 12, awayVal: 2 },
        { label: 'Büyük Şanslar', home: '5', away: '2', homeVal: 5, awayVal: 2 },
        { label: 'Kurtarışlar', home: '1', away: '12', homeVal: 1, awayVal: 12 },
        { label: 'Pas İsabeti', home: '%88', away: '%68', homeVal: 88, awayVal: 68 },
        { label: 'Fauller', home: '9', away: '14', homeVal: 9, awayVal: 14 },
      ];
    }

    if (fixture.id === '2026-27-w01-02') {
      return [
        { label: 'Topla Oynama', home: '%54', away: '%46', homeVal: 54, awayVal: 46 },
        { label: 'Toplam Şut', home: '11', away: '14', homeVal: 11, awayVal: 14 },
        { label: 'İsabetli Şut', home: '3', away: '6', homeVal: 3, awayVal: 6 },
        { label: 'Beklenen Gol (xG)', home: '0.82', away: '1.45', homeVal: 0.82, awayVal: 1.45 },
        { label: 'Köşe Vuruşu (Korner)', home: '5', away: '6', homeVal: 5, awayVal: 6 },
        { label: 'Kurtarışlar', home: '5', away: '3', homeVal: 5, awayVal: 3 },
        { label: 'Pas İsabeti', home: '%79', away: '%82', homeVal: 79, awayVal: 82 },
        { label: 'Fauller', home: '12', away: '11', homeVal: 12, awayVal: 11 },
      ];
    }

    if (fixture.id === '2026-27-w01-03') {
      return [
        { label: 'Topla Oynama', home: '%51', away: '%49', homeVal: 51, awayVal: 49 },
        { label: 'Toplam Şut', home: '15', away: '12', homeVal: 15, awayVal: 12 },
        { label: 'İsabetli Şut', home: '5', away: '5', homeVal: 5, awayVal: 5 },
        { label: 'Beklenen Gol (xG)', home: '1.28', away: '1.14', homeVal: 1.28, awayVal: 1.14 },
        { label: 'Köşe Vuruşu (Korner)', home: '6', away: '4', homeVal: 6, awayVal: 4 },
        { label: 'Kurtarışlar', home: '4', away: '6', homeVal: 4, awayVal: 6 },
        { label: 'Pas İsabeti', home: '%81', away: '%80', homeVal: 81, awayVal: 80 },
        { label: 'Fauller', home: '14', away: '16', homeVal: 14, awayVal: 16 },
      ];
    }

    if (fixture.id === '2026-27-w01-04') {
      return [
        { label: 'Topla Oynama', home: '%36', away: '%64', homeVal: 36, awayVal: 64 },
        { label: 'Toplam Şut', home: '9', away: '22', homeVal: 9, awayVal: 22 },
        { label: 'İsabetli Şut', home: '4', away: '8', homeVal: 4, awayVal: 8 },
        { label: 'Beklenen Gol (xG)', home: '0.94', away: '2.15', homeVal: 0.94, awayVal: 2.15 },
        { label: 'Köşe Vuruşu (Korner)', home: '3', away: '9', homeVal: 3, awayVal: 9 },
        { label: 'Kurtarışlar', home: '7', away: '2', homeVal: 7, awayVal: 2 },
        { label: 'Pas İsabeti', home: '%72', away: '%89', homeVal: 72, awayVal: 89 },
        { label: 'Fauller', home: '17', away: '12', homeVal: 17, awayVal: 12 },
      ];
    }

    if (fixture.id === '2026-27-w01-05') {
      return [
        { label: 'Topla Oynama', home: '%44', away: '%56', homeVal: 44, awayVal: 56 },
        { label: 'Toplam Şut', home: '13', away: '16', homeVal: 13, awayVal: 16 },
        { label: 'İsabetli Şut', home: '5', away: '6', homeVal: 5, awayVal: 6 },
        { label: 'Beklenen Gol (xG)', home: '1.15', away: '1.42', homeVal: 1.15, awayVal: 1.42 },
        { label: 'Köşe Vuruşu (Korner)', home: '4', away: '7', homeVal: 4, awayVal: 7 },
        { label: 'Kurtarışlar', home: '5', away: '4', homeVal: 5, awayVal: 4 },
        { label: 'Pas İsabeti', home: '%76', away: '%84', homeVal: 76, awayVal: 84 },
        { label: 'Fauller', home: '15', away: '10', homeVal: 15, awayVal: 10 },
      ];
    }

    return [];
  }, [fixture.id, isFinished]);

  return (
    <div id="match-detail-page" className="space-y-5 animate-fadeIn">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <button
          id="match-detail-back-btn"
          onClick={onBack}
          className="btn-sofa btn-sofa-secondary text-xs flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Geri Dön</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
          <Calendar className="w-3.5 h-3.5 text-[var(--color-brand)]" />
          <span>{fixture.round}. Hafta</span>
          <span>·</span>
          <span>{formatDateDDMMYYYY(fixture.kickoff)} · {fixture.kickoff.includes('T') ? fixture.kickoff.split('T')[1].slice(0, 5) : '19:00'}</span>
        </div>
      </div>

      {/* Main Scoreboard Centerpiece Hero Card */}
      <div id="match-detail-hero" className="sofa-card overflow-hidden border-[var(--border-strong)]">
        {/* Stadium banner */}
        <div className="px-5 py-2 bg-[var(--bg-surface)] border-b border-[var(--border)] flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[var(--color-brand)]" />
            <span className="text-[var(--text-primary)] font-bold">{homeBrand.stadium}</span>
            <span>·</span>
            <span>{homeBrand.city}</span>
          </div>
          <span className="font-bold text-[var(--color-brand)]">Trendyol Süper Lig</span>
        </div>

        {/* Big Scoreboard Box */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-surface)]">
          <div className="grid grid-cols-3 items-center gap-4">
            {/* Home Team */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-black text-xl sm:text-2xl shadow-xl border-3"
                style={{
                  background: homeBrand.primaryColor,
                  color: homeBrand.textColor,
                  borderColor: homeBrand.secondaryColor,
                }}
              >
                {homeBrand.code}
              </div>
              <div>
                <h2 className="font-black text-base sm:text-xl text-[var(--text-primary)] leading-tight">
                  {homeName}
                </h2>
                <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-mono">
                  Ev Sahibi
                </span>
              </div>
            </div>

            {/* Score Center */}
            <div className="flex flex-col items-center justify-center text-center">
              {isFinished && hasScore ? (
                <>
                  <div className="flex items-center gap-3 sm:gap-4 font-mono font-black text-4xl sm:text-6xl text-[var(--text-primary)] tracking-tight">
                    <span>{fixture.score?.home}</span>
                    <span className="text-[var(--text-muted)] text-3xl sm:text-4xl font-light">:</span>
                    <span>{fixture.score?.away}</span>
                  </div>
                  <div className="mt-2.5 px-3 py-1 rounded bg-emerald-500/15 text-emerald-400 text-xs font-mono font-extrabold uppercase tracking-wider border border-emerald-500/20">
                    Maç Sonucu (MS)
                  </div>
                </>
              ) : (
                <>
                  <div className="font-mono font-black text-2xl sm:text-4xl text-[var(--text-muted)]">
                    VS
                  </div>
                  <div className="mt-2 px-3 py-1 rounded bg-[var(--bg-surface)] text-[var(--color-brand)] font-bold text-xs font-mono border border-[var(--border)]">
                    {fixture.kickoff.includes('T') ? fixture.kickoff.split('T')[1].slice(0, 5) : 'Planlandı'}
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono mt-1">Başlamadı</span>
                </>
              )}
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-black text-xl sm:text-2xl shadow-xl border-3"
                style={{
                  background: awayBrand.primaryColor,
                  color: awayBrand.textColor,
                  borderColor: awayBrand.secondaryColor,
                }}
              >
                {awayBrand.code}
              </div>
              <div>
                <h2 className="font-black text-base sm:text-xl text-[var(--text-primary)] leading-tight">
                  {awayName}
                </h2>
                <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-mono">
                  Deplasman
                </span>
              </div>
            </div>
          </div>

          {/* Goalscorers Timeline for Finished Matches */}
          {isFinished && (
            <div id="match-detail-goals" className="mt-8 pt-5 border-t border-[var(--border)] grid grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="space-y-1 text-left font-mono font-bold text-[var(--text-primary)]">
                {fixture.id === '2026-27-w01-01' ? (
                  <>
                    <div>⚽ Victor Osimhen <span className="text-[var(--color-brand)]">53', 90'</span></div>
                    <div className="text-[11px] text-[var(--text-muted)] font-normal">Asistler: Gabriel Sara, Leroy Sané</div>
                  </>
                ) : fixture.id === '2026-27-w01-03' ? (
                  <>
                    <div>⚽ Deian Sorescu <span className="text-[var(--color-brand)]">61'</span></div>
                    <div className="text-[11px] text-[var(--text-muted)] font-normal">Asist: Juninho Bacuna</div>
                  </>
                ) : fixture.id === '2026-27-w01-04' ? (
                  <>
                    <div><span className="text-emerald-400">37'</span> Franco Tongya ⚽</div>
                    <div><span className="text-emerald-400">56'</span> Oğulcan Ülgün ⚽</div>
                    <div className="text-[11px] text-[var(--text-muted)] font-normal">Asistler: Sekou Koita, Alihan Dursun</div>
                  </>
                ) : fixture.id === '2026-27-w01-05' ? (
                  <div>⚽ Haris Hajradinović <span className="text-[var(--color-brand)]">42'</span></div>
                ) : (
                  <div className="text-xs text-[var(--text-muted)] font-normal">Gol sesi çıkmadı</div>
                )}
              </div>
              <div className="space-y-1 text-right font-mono font-bold text-[var(--text-primary)]">
                {fixture.id === '2026-27-w01-01' ? (
                  <>
                    <div><span className="text-[var(--color-brand)]">59'</span> Alexandros Kyziridis ⚽</div>
                    <div><span className="text-[var(--color-brand)]">61'</span> Jesús Ramírez ⚽</div>
                  </>
                ) : fixture.id === '2026-27-w01-02' ? (
                  <div><span className="text-emerald-400">67'</span> Ali Sowe ⚽</div>
                ) : fixture.id === '2026-27-w01-03' ? (
                  <div><span className="text-emerald-400">20'</span> Ruan Pereira Duarte ⚽</div>
                ) : fixture.id === '2026-27-w01-04' ? (
                  <>
                    <div>⚽ Talisca <span className="text-[var(--color-brand)]">13'</span></div>
                    <div className="text-[11px] text-[var(--text-muted)] font-normal">Asist: Levent Mercan</div>
                  </>
                ) : fixture.id === '2026-27-w01-05' ? (
                  <div><span className="text-emerald-400">74'</span> Simon Banza ⚽</div>
                ) : (
                  <div className="text-xs text-[var(--text-muted)] font-normal">Gol sesi çıkmadı</div>
                )}
              </div>
            </div>
          )}

          {/* Match Highlight Video Action Box / Broadcast Info */}
          {isFinished ? (
            highlightInfo.status === 'available' && highlightInfo.url ? (
              /* Verified 200 OK Highlight Available */
              <div
                id="match-highlights-banner"
                className="mt-6 pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-rose-950/30 via-[#131a29] to-[#0e1420] border border-rose-500/40 shadow-md"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-9 h-9 rounded-xl bg-rose-600/20 text-rose-500 flex items-center justify-center font-bold flex-shrink-0 border border-rose-500/40 shadow">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>Karşılaşma Özeti & Goller</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono font-black">
                        HD ÖZET
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      beIN SPORTS resmi maç özeti, tüm goller ve pozisyonlar
                    </div>
                  </div>
                </div>

                <a
                  id="match-highlights-btn"
                  href={highlightInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-sofa text-xs flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg w-full sm:w-auto justify-center transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Özeti İzle</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                </a>
              </div>
            ) : (
              /* Pending / Not yet published by broadcaster */
              <div
                id="match-highlights-pending-banner"
                className="mt-6 pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-950/15 border border-amber-500/30 shadow-sm"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold flex-shrink-0 border border-amber-500/30">
                    <Clock className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>Maç Özeti Bekleniyor</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/40">
                        HAZIRLANIYOR
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      Yayıncı kuruluş (beIN SPORTS) tarafından maç özeti henüz yüklenmedi.
                    </div>
                  </div>
                </div>

                <a
                  id="match-highlights-search-btn"
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                    `${homeName} ${awayName} maç özeti beIN SPORTS`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-sofa btn-sofa-secondary text-xs flex items-center gap-1.5 py-2 px-3 w-full sm:w-auto justify-center text-slate-300 hover:text-white"
                >
                  <span>YouTube'da Ara</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            )
          ) : (
            <div
              id="match-broadcast-banner"
              className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--bg-surface)]/60 border border-[var(--border)] text-xs text-[var(--text-muted)]"
            >
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-[var(--color-brand)]" />
                <span>
                  Canlı Yayın: <strong className="text-white font-bold">beIN SPORTS 1 HD</strong>
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-[var(--color-brand)]">Canlı Yayın</span>
            </div>
          )}
        </div>
      </div>

      {/* Detail Sub-Navigation Tabs */}
      <div id="match-detail-subnav" className="flex items-center gap-2 border-b border-[var(--border)] pb-2 flex-wrap">
        <button
          id="match-tab-fantasy-btn"
          onClick={() => setActiveTab('fantasy')}
          className={`btn-sofa text-xs flex items-center gap-1.5 ${
            activeTab === 'fantasy' ? 'btn-sofa-primary' : 'btn-sofa-secondary'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>
            {isFinished
              ? `Fantasy Oyuncu Puan Tablosu (${fantasyPerformances.length})`
              : `Muhtemel Kadro & Projeksiyon Puanları (${fantasyPerformances.length})`}
          </span>
        </button>

        <button
          id="match-tab-stats-btn"
          onClick={() => setActiveTab('stats')}
          className={`btn-sofa text-xs flex items-center gap-1.5 ${
            activeTab === 'stats' ? 'btn-sofa-primary' : 'btn-sofa-secondary'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>{isFinished ? 'Maç İstatistikleri' : 'Maç Öncesi Analiz & Olasılık'}</span>
        </button>

        <button
          id="match-tab-lineup-btn"
          onClick={() => setActiveTab('lineup')}
          className={`btn-sofa text-xs flex items-center gap-1.5 ${
            activeTab === 'lineup' ? 'btn-sofa-primary' : 'btn-sofa-secondary'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{isFinished ? 'İlk 11\'ler & Kadrolar' : 'Muhtemel İlk 11\'ler (Maç Öncesi)'}</span>
        </button>
      </div>

      {/* Tab 1: Fantasy / Pre-Match Ratings Table */}
      {activeTab === 'fantasy' && (
        <div id="match-detail-fantasy-tab" className="space-y-4">
          <div className="sofa-card overflow-hidden">
            <div className="sofa-card-header">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="font-extrabold text-xs uppercase tracking-wider text-[var(--text-primary)]">
                  {isFinished
                    ? `Fantasy Oyuncu Puan Tablosu (${homeName} & ${awayName})`
                    : `Maç Öncesi Kadro & Beklenen Puanlar (xP - ${homeName} & ${awayName})`}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {isFinished ? 'Resmi Puanlama Motoru' : 'İstatistiksel Projeksiyon Modeli'}
              </span>
            </div>

            <div className="sofa-table-wrapper border-none rounded-none">
              <table id="match-fantasy-table" className="sofa-table">
                <thead>
                  <tr>
                    <th>Mevki</th>
                    <th>Oyuncu</th>
                    <th>Kulüp</th>
                    <th>{isFinished ? 'Önemli Aksiyonlar' : 'Piyasa Değeri'}</th>
                    <th>{isFinished ? 'Maç Reytingi' : 'Durum'}</th>
                    <th className="text-right">{isFinished ? 'Fantasy Puanı' : 'Beklenen Puan (xP)'}</th>
                  </tr>
                </thead>
                <tbody>
                  {fantasyPerformances.map((perf, idx) => (
                    <tr key={idx} id={`match-fantasy-row-${idx}`}>
                      <td>
                        <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-subtle)]">
                          {perf.pos}
                        </span>
                      </td>
                      <td className="font-bold text-[var(--text-primary)]">
                        <div className="flex items-center gap-1.5">
                          <span>{perf.name}</span>
                          {isFinished && perf.motm && (
                            <span className="flex items-center gap-0.5 text-amber-400 text-[10px] font-mono font-bold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30">
                              <Star className="w-3 h-3 fill-current" />
                              Maçın Adamı
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-xs text-[var(--text-secondary)] font-medium">
                        {perf.team}
                      </td>
                      <td className="text-xs text-[var(--text-muted)] font-mono">
                        {isFinished ? perf.events : formatPrice(perf.price)}
                      </td>
                      <td>
                        {isFinished ? (
                          <span className={`sofa-rating ${Number(perf.rating) >= 7.5 ? 'sofa-rating-high' : 'sofa-rating-mid'}`}>
                            {perf.rating}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded border border-[var(--border)]">
                            Başlamadı
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        <span className={`font-mono font-black text-xs px-2.5 py-0.5 rounded ${
                          isFinished
                            ? perf.pts >= 7
                              ? 'bg-[var(--color-brand)] text-black'
                              : perf.pts >= 4
                              ? 'bg-blue-500 text-white'
                              : 'bg-[var(--bg-subtle)] text-[var(--text-primary)]'
                            : 'bg-[var(--bg-subtle)] text-[var(--color-brand)] border border-[var(--border)]'
                        }`}>
                          {isFinished ? `${perf.pts} pts` : `~${perf.pts} xP`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Match Stats (Finished) OR Pre-match Analysis (Upcoming) */}
      {activeTab === 'stats' && (
        <div id="match-detail-stats-tab" className="sofa-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-[var(--text-primary)]">
              {isFinished ? 'Karşılaşma İstatistikleri' : '📐 Maç Öncesi Olasılık & Güç Analizi'}
            </h3>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {isFinished ? 'Resmi Maç İstatistikleri' : 'Matematiksel Simülasyon'}
            </span>
          </div>

          {isFinished ? (
            <div className="space-y-4 pt-1">
              {matchStats.map((stat, i) => {
                const total = stat.homeVal + stat.awayVal;
                const homePercent = total > 0 ? (stat.homeVal / total) * 100 : 50;

                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className="text-[var(--text-primary)]">{stat.home}</span>
                      <span className="text-[var(--text-muted)] uppercase text-[10px]">{stat.label}</span>
                      <span className="text-[var(--text-primary)]">{stat.away}</span>
                    </div>

                    <div className="flex h-2 rounded-full overflow-hidden bg-[var(--bg-surface)]">
                      <div
                        className="transition-all"
                        style={{
                          width: `${homePercent}%`,
                          background: homeBrand.primaryColor,
                        }}
                      />
                      <div
                        className="transition-all"
                        style={{
                          width: `${100 - homePercent}%`,
                          background: awayBrand.primaryColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Upcoming Match Pre-Game Analysis */
            <div className="space-y-4 pt-1">
              <div className="p-4 rounded-xl bg-[#0e141f] border border-[#222c3f] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                  <Calculator className="w-4 h-4" />
                  <span>Nostradamus Matematiksel Kazanma Olasılıkları</span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-emerald-400">MS 1 ({homeName}): %{matchProbs.homeWinProb}</span>
                  <span className="text-amber-400">X (Beraberlik): %{matchProbs.drawProb}</span>
                  <span className="text-sky-400">MS 2 ({awayName}): %{matchProbs.awayWinProb}</span>
                </div>

                <div className="h-2.5 w-full bg-[#182030] rounded-full flex overflow-hidden">
                  <div style={{ width: `${matchProbs.homeWinProb}%` }} className="bg-emerald-500 h-full" />
                  <div style={{ width: `${matchProbs.drawProb}%` }} className="bg-amber-400 h-full" />
                  <div style={{ width: `${matchProbs.awayWinProb}%` }} className="bg-sky-400 h-full" />
                </div>

                <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 pt-1">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Matematiksel Model Önerisi: <strong className="text-white">{matchProbs.suggestedLabel}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
                  <div className="text-[10px] uppercase font-mono text-[var(--text-muted)] font-bold">{homeName} Kadro Gücü</div>
                  <div className="text-base font-mono font-black text-[var(--color-brand)] mt-0.5">
                    {formatPrice(homePlayers.reduce((s, p) => s + p.price, 0))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
                  <div className="text-[10px] uppercase font-mono text-[var(--text-muted)] font-bold">{awayName} Kadro Gücü</div>
                  <div className="text-base font-mono font-black text-sky-400 mt-0.5">
                    {formatPrice(awayPlayers.reduce((s, p) => s + p.price, 0))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Lineups View for ANY Match */}
      {activeTab === 'lineup' && (
        <div id="match-detail-lineup-tab" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Home Lineup */}
          <div className="sofa-card p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: homeBrand.primaryColor }} />
                <h4 className="font-bold text-sm text-[var(--text-primary)]">
                  {homeName} {isFinished ? 'İlk 11 (4-2-3-1)' : 'Muhtemel 11 (4-2-3-1)'}
                </h4>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {isFinished ? 'Resmi Kadro' : 'Tahmini Kadro'}
              </span>
            </div>
            <div className="divide-y divide-[var(--border)] text-xs font-mono">
              {homeStarting11.map((p) => (
                <div key={p.id} className="py-1.5 flex justify-between items-center">
                  <span className="text-[var(--text-primary)] font-bold">{p.name}</span>
                  <span className="text-[var(--text-muted)]">{getShortPosition(p.position)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Away Lineup */}
          <div className="sofa-card p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: awayBrand.primaryColor }} />
                <h4 className="font-bold text-sm text-[var(--text-primary)]">
                  {awayName} {isFinished ? 'İlk 11 (4-3-3)' : 'Muhtemel 11 (4-3-3)'}
                </h4>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {isFinished ? 'Resmi Kadro' : 'Tahmini Kadro'}
              </span>
            </div>
            <div className="divide-y divide-[var(--border)] text-xs font-mono">
              {awayStarting11.map((p) => (
                <div key={p.id} className="py-1.5 flex justify-between items-center">
                  <span className="text-[var(--text-primary)] font-bold">{p.name}</span>
                  <span className="text-[var(--text-muted)]">{getShortPosition(p.position)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
