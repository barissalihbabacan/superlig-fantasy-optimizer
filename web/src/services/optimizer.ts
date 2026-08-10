import { Player, ProjectionItem, FormationType } from '../types';

export interface OptimizationResult {
  startingXI: Player[];
  bench: Player[];
  captain: Player | null;
  viceCaptain: Player | null;
  totalPrice: number;
  totalPoints: number;
  formation: FormationType;
}

const FORMATION_COUNTS: Record<string, { def: number; mid: number; fwd: number }> = {
  '3-5-2': { def: 3, mid: 5, fwd: 2 },
  '3-4-3': { def: 3, mid: 4, fwd: 3 },
  '4-3-3': { def: 4, mid: 3, fwd: 3 },
  '4-4-2': { def: 4, mid: 4, fwd: 2 },
  '4-5-1': { def: 4, mid: 5, fwd: 1 },
  '5-4-1': { def: 5, mid: 4, fwd: 1 },
  '5-3-2': { def: 5, mid: 3, fwd: 2 },
  '5-2-3': { def: 5, mid: 2, fwd: 3 },
};

export function runClientOptimizer(
  players: Player[],
  projections: Map<string, ProjectionItem>,
  _budget: number,
  selectedFormation: FormationType
): OptimizationResult {
  const getPoints = (playerId: string) => projections.get(playerId)?.expected_points || 0;

  const scoredPlayers = players.map((p) => ({
    ...p,
    points: getPoints(p.id),
  }));

  // Determine best formation if Auto
  let chosenFormation: string = selectedFormation;
  if (selectedFormation === 'Auto') {
    chosenFormation = '4-3-3';
  }

  const counts = FORMATION_COUNTS[chosenFormation] || FORMATION_COUNTS['4-3-3'];

  // Group by position sorted by points descending
  const gks = scoredPlayers.filter((p) => p.position === 'Goalkeeper').sort((a, b) => b.points - a.points || a.price - b.price);
  const defs = scoredPlayers.filter((p) => p.position === 'Defender').sort((a, b) => b.points - a.points || a.price - b.price);
  const mids = scoredPlayers.filter((p) => p.position === 'Midfielder').sort((a, b) => b.points - a.points || a.price - b.price);
  const fwds = scoredPlayers.filter((p) => p.position === 'Forward').sort((a, b) => b.points - a.points || a.price - b.price);

  const teamCounts = new Map<string, number>();
  const canAdd = (p: Player) => (teamCounts.get(p.team_id) || 0) < 3;
  const addPlayer = (p: Player) => teamCounts.set(p.team_id, (teamCounts.get(p.team_id) || 0) + 1);

  // Pick Starting XI
  const startingXI: Player[] = [];

  // 1 GK
  const startGk = gks.find(canAdd) || gks[0];
  if (startGk) { startingXI.push(startGk); addPlayer(startGk); }

  // DEF
  defs.filter(canAdd).slice(0, counts.def).forEach((p) => { startingXI.push(p); addPlayer(p); });

  // MID
  mids.filter(canAdd).slice(0, counts.mid).forEach((p) => { startingXI.push(p); addPlayer(p); });

  // FWD
  fwds.filter(canAdd).slice(0, counts.fwd).forEach((p) => { startingXI.push(p); addPlayer(p); });

  // Pick Bench
  const bench: Player[] = [];

  // 1 Bench GK
  const benchGk = gks.find((p) => !startingXI.includes(p) && canAdd(p)) || gks.find((p) => !startingXI.includes(p));
  if (benchGk) { bench.push(benchGk); addPlayer(benchGk); }

  // 2 Bench DEF
  defs.filter((p) => !startingXI.includes(p) && canAdd(p)).slice(0, 5 - counts.def).forEach((p) => { bench.push(p); addPlayer(p); });

  // 2 Bench MID
  mids.filter((p) => !startingXI.includes(p) && canAdd(p)).slice(0, 5 - counts.mid).forEach((p) => { bench.push(p); addPlayer(p); });

  // 1 Bench FWD
  fwds.filter((p) => !startingXI.includes(p) && canAdd(p)).slice(0, 3 - counts.fwd).forEach((p) => { bench.push(p); addPlayer(p); });

  // Captain & Vice Captain
  const sortedXI = [...startingXI].sort((a, b) => getPoints(b.id) - getPoints(a.id));
  const captain = sortedXI[0] || null;
  const viceCaptain = sortedXI[1] || null;

  const totalPrice = [...startingXI, ...bench].reduce((sum, p) => sum + p.price, 0);
  const totalPoints = startingXI.reduce((sum, p) => sum + getPoints(p.id), 0) + (captain ? getPoints(captain.id) : 0);

  return {
    startingXI,
    bench,
    captain,
    viceCaptain,
    totalPrice,
    totalPoints,
    formation: chosenFormation as FormationType,
  };
}
