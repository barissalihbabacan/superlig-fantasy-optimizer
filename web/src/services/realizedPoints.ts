/**
 * Gerçekleşen (geçmiş maçlardan hesaplanmış) oyuncu fantasy puanları.
 *
 * Tek otorite Rust'taki `scoring.rs::calculate_player_match_score` — bu dosya
 * kuralları (gol/asist/kart/temiz sayfa puan değerleri vb.) TypeScript'te
 * TEKRAR YAZMAZ; her performans için gerçek WASM bağlayıcısını
 * (`calculatePlayerMatchScore`, bkz. `crates/wasm-bindings/src/lib.rs`) çağırır.
 * Bu, `src/projection_engine.rs::to_match_performance`'ın yaptığı aynı
 * dönüşümün (oyuncunun `players.json`'daki mevkisini ham maç performansına
 * ekleme) TypeScript karşılığıdır.
 *
 * Bir maç için `data/2026-27/matches/*.json` altında dosya yoksa o maça ait
 * hiçbir oyuncuya puan atanmaz — sıfır veya tahmini bir değer uydurulmaz;
 * bkz. `getMatchDataCoverage` ve `RealizedPlayerStats.matchesWithData`.
 */
import init, { calculatePlayerMatchScore } from '../../wasm-pkg/sfo_wasm.js';
import wasmUrl from '../../wasm-pkg/sfo_wasm_bg.wasm?url';
import { Fixture, Player } from '../types';

export interface MatchScore {
  home: number;
  away: number;
}

export interface MatchPlayerPerformanceRaw {
  player_id: string;
  team_id: string;
  minutes: number;
  goals: number;
  assists: number;
  saves: number;
  penalty_saves: number;
  penalty_misses: number;
  goals_conceded: number;
  yellow_cards: number;
  red_cards: number;
  own_goals: number;
  clean_sheet: boolean;
  bonus_rank: number | null;
}

export interface MatchDataset {
  schema_version: number;
  season: string;
  source: { name: string; retrieved_at: string; url?: string };
  match_id: string;
  status: string;
  score: MatchScore;
  players: MatchPlayerPerformanceRaw[];
}

/** `src/models.rs::PlayerMatchScore`'un WASM üzerinden dönen karşılığı. */
export interface PlayerMatchScoreBreakdown {
  player_id: number;
  player_name: string;
  minutes_points: number;
  goals_points: number;
  assists_points: number;
  clean_sheet_points: number;
  saves_points: number;
  penalties_points: number;
  goals_conceded_points: number;
  cards_points: number;
  own_goal_points: number;
  bonus_points: number;
  total: number;
}

export type ScoreFn = (performanceJson: unknown, rulesJson: unknown) => PlayerMatchScoreBreakdown;

export interface RealizedMatchPerformance {
  matchId: string;
  fixtureId?: string;
  round?: number;
  opponentTeamId: string;
  isHome: boolean;
  teamGoals: number;
  opponentGoals: number;
  points: number;
  cleanSheet: boolean;
  won: boolean;
}

export interface RealizedPlayerStats {
  playerId: string;
  /** Oyuncu bazlı veri dosyası bulunan, oyuncunun süre aldığı maç sayısı. */
  matchesWithData: number;
  totalPoints: number;
  averagePoints: number;
  cleanSheets: number;
  last5Form: number[];
  matchHistory: RealizedMatchPerformance[];
}

export interface MatchDataCoverage {
  finishedFixtures: number;
  fixturesWithPlayerData: number;
  missingFixtureIds: string[];
}

/** Tek bir maçtaki bir oyuncunun gerçek, ham performansı + WASM'dan gelen puanı. */
export interface RealizedMatchPlayerEvent {
  playerId: string;
  playerName: string;
  teamId: string;
  position: Player['position'];
  minutes: number;
  goals: number;
  assists: number;
  saves: number;
  penaltySaves: number;
  penaltyMisses: number;
  goalsConceded: number;
  yellowCards: number;
  redCards: number;
  ownGoals: number;
  cleanSheet: boolean;
  bonusRank: number | null;
  points: number;
}

/**
 * `players.json`'daki mevkiyi ham maç performansına ekleyip Rust'ın
 * `MatchPerformance` şekline dönüştürür — `src/projection_engine.rs::to_match_performance`
 * ile aynı dönüşüm. Tek yerde tanımlanır; hem maç geçmişi toplama (`computeRealizedStats`)
 * hem de tek-maç olay listesi (`computeMatchPlayerEvents`) bunu paylaşır.
 */
function toRustPerformance(player: Player, raw: MatchPlayerPerformanceRaw) {
  return {
    player_id: 0,
    player_name: player.name,
    position: player.position,
    minutes: raw.minutes,
    goals: raw.goals,
    assists: raw.assists,
    saves: raw.saves,
    penalty_saves: raw.penalty_saves,
    penalty_misses: raw.penalty_misses,
    goals_conceded: raw.goals_conceded,
    yellow_cards: raw.yellow_cards,
    red_cards: raw.red_cards,
    own_goals: raw.own_goals,
    clean_sheet: raw.clean_sheet,
    bonus_rank: raw.bonus_rank,
  };
}

const matchModules = import.meta.glob<{ default: MatchDataset }>(
  '../../../data/2026-27/matches/*.json',
  { eager: true }
);

export function loadMatchDatasets(): MatchDataset[] {
  return Object.values(matchModules).map((mod) => mod.default);
}

let readyPromise: Promise<void> | null = null;

function ensureWasmReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = init({ module_or_path: wasmUrl }).then(() => undefined);
  }
  return readyPromise;
}

/** Bitmiş fikstür sayısına kıyasla oyuncu bazlı maç verisinin gerçek kapsamı. */
export function getMatchDataCoverage(
  fixtures: Fixture[],
  matchDatasets: MatchDataset[] = loadMatchDatasets()
): MatchDataCoverage {
  const withData = new Set(
    matchDatasets.filter((dataset) => dataset.status === 'finished').map((dataset) => dataset.match_id)
  );
  const finished = fixtures.filter((fixture) => fixture.status === 'finished');
  const missing = finished.filter((fixture) => !withData.has(fixture.id)).map((fixture) => fixture.id);
  return {
    finishedFixtures: finished.length,
    fixturesWithPlayerData: finished.length - missing.length,
    missingFixtureIds: missing,
  };
}

/**
 * Saf toplama mantığı — WASM init'ten bağımsız, doğrudan test edilebilir.
 * `scoreFn`, gerçek Rust puanlama motorunu (WASM üzerinden) veya testte
 * doğrudan başlatılmış aynı fonksiyonu temsil eder; burada puanlama kuralı
 * ikinci kez yazılmaz.
 */
export function computeRealizedStats(
  players: Player[],
  fixtures: Fixture[],
  matchDatasets: MatchDataset[],
  scoreFn: ScoreFn
): Map<string, RealizedPlayerStats> {
  const playerById = new Map(players.map((player) => [player.id, player]));
  const fixtureById = new Map(fixtures.map((fixture) => [fixture.id, fixture]));

  const finishedDatasets = matchDatasets
    .filter((dataset) => dataset.status === 'finished')
    .sort((a, b) => {
      const roundA = fixtureById.get(a.match_id)?.round ?? 0;
      const roundB = fixtureById.get(b.match_id)?.round ?? 0;
      return roundA - roundB;
    });

  const historyByPlayer = new Map<string, RealizedMatchPerformance[]>();

  for (const dataset of finishedDatasets) {
    const fixture = fixtureById.get(dataset.match_id);
    for (const raw of dataset.players) {
      // Sağlam veri bütünlüğü için Rust'taki aynı korumaları uygular:
      // maç geçmişine, ancak bilinen bir oyuncu gerçekten süre aldıysa girer.
      const player = playerById.get(raw.player_id);
      if (!player || player.team_id !== raw.team_id || raw.minutes === 0) {
        continue;
      }

      const score = scoreFn(toRustPerformance(player, raw), undefined);

      const isHome = fixture ? fixture.home_team_id === player.team_id : true;
      const teamGoals = fixture ? (isHome ? dataset.score.home : dataset.score.away) : dataset.score.home;
      const opponentGoals = fixture
        ? isHome
          ? dataset.score.away
          : dataset.score.home
        : dataset.score.away;
      const opponentTeamId = fixture
        ? isHome
          ? fixture.away_team_id
          : fixture.home_team_id
        : 'unknown';

      const entry: RealizedMatchPerformance = {
        matchId: dataset.match_id,
        fixtureId: fixture?.id,
        round: fixture?.round,
        opponentTeamId,
        isHome,
        teamGoals,
        opponentGoals,
        points: score.total,
        cleanSheet: raw.clean_sheet,
        won: teamGoals > opponentGoals,
      };

      const list = historyByPlayer.get(raw.player_id) ?? [];
      list.push(entry);
      historyByPlayer.set(raw.player_id, list);
    }
  }

  const statsMap = new Map<string, RealizedPlayerStats>();
  for (const player of players) {
    const history = historyByPlayer.get(player.id) ?? [];
    const totalPoints = history.reduce((sum, match) => sum + match.points, 0);
    const matchesWithData = history.length;
    const averagePoints = matchesWithData > 0 ? Number((totalPoints / matchesWithData).toFixed(1)) : 0;
    const cleanSheets = history.filter(
      (match) => match.cleanSheet && (player.position === 'Goalkeeper' || player.position === 'Defender')
    ).length;

    statsMap.set(player.id, {
      playerId: player.id,
      matchesWithData,
      totalPoints,
      averagePoints,
      cleanSheets,
      last5Form: history.slice(-5).map((match) => match.points),
      matchHistory: history,
    });
  }

  return statsMap;
}

/** Sayfalarda kullanılan genel giriş noktası: WASM'ı hazırlar, gerçek dataset'i yükler. */
export async function calculateRealizedPlayerStats(
  players: Player[],
  fixtures: Fixture[]
): Promise<Map<string, RealizedPlayerStats>> {
  await ensureWasmReady();
  return computeRealizedStats(
    players,
    fixtures,
    loadMatchDatasets(),
    calculatePlayerMatchScore as unknown as ScoreFn
  );
}

/**
 * Saf mantık — belirli bir maçın gerçek oyuncu bazlı olaylarını (gol, asist,
 * kart, kurtarış, bonus_rank) ve WASM'dan gelen fantasy puanını döner.
 * `data/2026-27/matches/<matchId>.json` yoksa veya maç henüz bitmemişse
 * `null` döner — bu durumda çağıran taraf HİÇBİR veri uydurmamalı, açıkça
 * "veri mevcut değil" göstermelidir (bkz. `web/src/pages/MatchDetail.tsx`).
 */
export function computeMatchPlayerEvents(
  matchId: string,
  players: Player[],
  matchDatasets: MatchDataset[],
  scoreFn: ScoreFn
): RealizedMatchPlayerEvent[] | null {
  const dataset = matchDatasets.find(
    (item) => item.match_id === matchId && item.status === 'finished'
  );
  if (!dataset) {
    return null;
  }

  const playerById = new Map(players.map((player) => [player.id, player]));
  const events: RealizedMatchPlayerEvent[] = [];

  for (const raw of dataset.players) {
    const player = playerById.get(raw.player_id);
    if (!player || player.team_id !== raw.team_id || raw.minutes === 0) {
      continue;
    }

    const score = scoreFn(toRustPerformance(player, raw), undefined);

    events.push({
      playerId: player.id,
      playerName: player.name,
      teamId: player.team_id,
      position: player.position,
      minutes: raw.minutes,
      goals: raw.goals,
      assists: raw.assists,
      saves: raw.saves,
      penaltySaves: raw.penalty_saves,
      penaltyMisses: raw.penalty_misses,
      goalsConceded: raw.goals_conceded,
      yellowCards: raw.yellow_cards,
      redCards: raw.red_cards,
      ownGoals: raw.own_goals,
      cleanSheet: raw.clean_sheet,
      bonusRank: raw.bonus_rank,
      points: score.total,
    });
  }

  return events;
}

/** Sayfalarda kullanılan genel giriş noktası: WASM'ı hazırlar, gerçek dataset'i yükler. */
export async function getMatchPlayerEvents(
  matchId: string,
  players: Player[]
): Promise<RealizedMatchPlayerEvent[] | null> {
  await ensureWasmReady();
  return computeMatchPlayerEvents(
    matchId,
    players,
    loadMatchDatasets(),
    calculatePlayerMatchScore as unknown as ScoreFn
  );
}
