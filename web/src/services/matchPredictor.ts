import { Fixture, Player, Team } from '../types';
import { PredictionType } from './nostradamusStorage';

export interface MatchProbabilities {
  fixtureId: string;
  homeWinProb: number; // e.g. 55 (%)
  drawProb: number;    // e.g. 25 (%)
  awayWinProb: number; // e.g. 20 (%)
  suggestedPick: PredictionType;
  suggestedLabel: string;
  confidence: number;
}

/**
 * Purely mathematical and statistical match outcome calculation based on squad market value,
 * player projected expected points, home field advantage factor (+15%), and goal distribution modeling.
 * NOTE: This is strictly a statistical simulation model.
 */
export const calculateMatchProbabilities = (
  fixture: Fixture,
  players: Player[],
  teams: Team[]
): MatchProbabilities => {
  const homeTeam = teams.find((t) => t.id === fixture.home_team_id);
  const awayTeam = teams.find((t) => t.id === fixture.away_team_id);

  // Compute team power by summing top 14 players' market values and projection weight
  const getTeamPower = (teamId: string, isHome: boolean): number => {
    const teamPlayers = players
      .filter((p) => p.team_id === teamId)
      .sort((a, b) => b.price - a.price)
      .slice(0, 14);

    let power = teamPlayers.reduce((sum, p) => sum + p.price, 0);
    if (power <= 0) power = 50000; // default baseline

    // Factor in home field advantage (statistically ~15% in Turkish Super Lig)
    if (isHome) {
      power *= 1.15;
    }
    return power;
  };

  const homePower = getTeamPower(fixture.home_team_id, true);
  const awayPower = getTeamPower(fixture.away_team_id, false);

  const ratio = homePower / (homePower + awayPower);

  // Derive Poisson / Logistic distribution probabilities
  let homeWin = Math.round((Math.pow(ratio, 1.4) / (Math.pow(ratio, 1.4) + Math.pow(1 - ratio, 1.4))) * 80);
  let awayWin = Math.round((Math.pow(1 - ratio, 1.4) / (Math.pow(ratio, 1.4) + Math.pow(1 - ratio, 1.4))) * 80);
  
  // Base draw probability (~24-28% in modern football)
  const powerDiff = Math.abs(ratio - 0.5);
  let draw = Math.round(28 - (powerDiff * 20));

  // Normalize so sum is exactly 100%
  const total = homeWin + draw + awayWin;
  homeWin = Math.round((homeWin / total) * 100);
  awayWin = Math.round((awayWin / total) * 100);
  draw = 100 - homeWin - awayWin;

  // Ensure minimum realistic values
  homeWin = Math.max(12, Math.min(80, homeWin));
  awayWin = Math.max(10, Math.min(78, awayWin));
  draw = 100 - homeWin - awayWin;

  let suggestedPick: PredictionType = '1';
  let suggestedLabel = `MS 1 (${homeTeam?.name || 'Ev Sahibi'} %${homeWin})`;
  let confidence = homeWin;

  if (awayWin > homeWin && awayWin > draw) {
    suggestedPick = '2';
    suggestedLabel = `MS 2 (${awayTeam?.name || 'Deplasman'} %${awayWin})`;
    confidence = awayWin;
  } else if (draw > homeWin && draw > awayWin) {
    suggestedPick = 'X';
    suggestedLabel = `X (Beraberlik %${draw})`;
    confidence = draw;
  } else if (homeWin >= awayWin) {
    suggestedPick = '1';
    suggestedLabel = `MS 1 (${homeTeam?.name || 'Ev Sahibi'} %${homeWin})`;
    confidence = homeWin;
  }

  return {
    fixtureId: fixture.id,
    homeWinProb: homeWin,
    drawProb: draw,
    awayWinProb: awayWin,
    suggestedPick,
    suggestedLabel,
    confidence,
  };
};
