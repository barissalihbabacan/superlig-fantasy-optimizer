import { Player, Fixture, PositionType } from '../types';

export interface PlayerMatchPerformance {
  fixtureId: string;
  round: number;
  opponentTeamId: string;
  isHome: boolean;
  teamGoals: number;
  opponentGoals: number;
  points: number;
  cleanSheet: boolean;
  won: boolean;
}

export interface CalculatedPlayerStats {
  playerId: string;
  matchesPlayed: number;
  totalPoints: number;
  averagePoints: number;
  cleanSheets: number;
  last5Form: number[];
  matchHistory: PlayerMatchPerformance[];
}

/**
 * Calculates match fantasy points for a player based on official rules:
 * - Playing / appearance: +2 pts
 * - Clean Sheet: GK/DEF +4 pts, MID +1 pt (if opponent goals === 0)
 * - Goals conceded penalty: GK/DEF -1 pt per 2 goals conceded
 * - Match victory bonus: +1 pt
 * - Offensive team goal participation weighting (approx. baseline based on position & team goals)
 */
export function calculateMatchPoints(
  position: PositionType,
  isHome: boolean,
  homeScore: number,
  awayScore: number
): { points: number; cleanSheet: boolean; won: boolean; teamGoals: number; opponentGoals: number } {
  const teamGoals = isHome ? homeScore : awayScore;
  const opponentGoals = isHome ? awayScore : homeScore;

  let pts = 2; // Appearance baseline (played 60+ mins)
  const cleanSheet = opponentGoals === 0;
  const won = teamGoals > opponentGoals;

  // Clean sheet bonuses
  if (cleanSheet) {
    if (position === 'Goalkeeper' || position === 'Defender') {
      pts += 4;
    } else if (position === 'Midfielder') {
      pts += 1;
    }
  }

  // Goals conceded penalty (GK & DEF)
  if (position === 'Goalkeeper' || position === 'Defender') {
    const penaltyUnits = Math.floor(opponentGoals / 2);
    pts -= penaltyUnits * 1;
  }

  // Victory bonus
  if (won) {
    pts += 1;
  }

  // Offensive contribution expectation per team goal scored
  if (teamGoals > 0) {
    if (position === 'Forward') {
      pts += Math.min(teamGoals * 2, 6);
    } else if (position === 'Midfielder') {
      pts += Math.min(teamGoals * 1, 4);
    } else if (position === 'Defender') {
      pts += Math.min(Math.floor(teamGoals / 2), 2);
    }
  }

  return {
    points: Math.max(pts, 0),
    cleanSheet,
    won,
    teamGoals,
    opponentGoals,
  };
}

/**
 * Aggregates all completed matches and computes real-time stats for all players.
 */
export function calculateAllPlayerStats(
  players: Player[],
  fixtures: Fixture[]
): Map<string, CalculatedPlayerStats> {
  const statsMap = new Map<string, CalculatedPlayerStats>();

  // Filter finished matches with recorded scores
  const finishedFixtures = (fixtures || []).filter(
    (f) => f.status === 'finished' && f.score && typeof f.score.home === 'number' && typeof f.score.away === 'number'
  );

  // Group finished fixtures by team
  const teamMatches = new Map<string, Fixture[]>();
  for (const f of finishedFixtures) {
    if (!teamMatches.has(f.home_team_id)) teamMatches.set(f.home_team_id, []);
    if (!teamMatches.has(f.away_team_id)) teamMatches.set(f.away_team_id, []);
    teamMatches.get(f.home_team_id)!.push(f);
    teamMatches.get(f.away_team_id)!.push(f);
  }

  for (const player of players) {
    const pMatches = teamMatches.get(player.team_id) || [];
    // Sort matches by round ascending
    pMatches.sort((a, b) => (a.round || 0) - (b.round || 0));

    let totalPts = 0;
    let cleanSheets = 0;
    const history: PlayerMatchPerformance[] = [];
    const formScores: number[] = [];

    for (const f of pMatches) {
      if (!f.score) continue;
      const isHome = f.home_team_id === player.team_id;
      const opponentTeamId = isHome ? f.away_team_id : f.home_team_id;

      const result = calculateMatchPoints(
        player.position,
        isHome,
        f.score.home,
        f.score.away
      );

      totalPts += result.points;
      if (result.cleanSheet && (player.position === 'Goalkeeper' || player.position === 'Defender')) {
        cleanSheets += 1;
      }

      const matchPerf: PlayerMatchPerformance = {
        fixtureId: f.id,
        round: f.round,
        opponentTeamId,
        isHome,
        teamGoals: result.teamGoals,
        opponentGoals: result.opponentGoals,
        points: result.points,
        cleanSheet: result.cleanSheet,
        won: result.won,
      };

      history.push(matchPerf);
      formScores.push(result.points);
    }

    const matchesCount = history.length;
    const avgPts = matchesCount > 0 ? Number((totalPts / matchesCount).toFixed(1)) : 0;
    const last5Form = formScores.slice(-5);

    statsMap.set(player.id, {
      playerId: player.id,
      matchesPlayed: matchesCount,
      totalPoints: totalPts,
      averagePoints: avgPts,
      cleanSheets,
      last5Form,
      matchHistory: history,
    });
  }

  return statsMap;
}
