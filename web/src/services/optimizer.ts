import { Player, ProjectionItem, FormationType, PositionType } from '../types';
import { optimizeSquadInWorker } from './optimizerWasm';

export interface OptimizationResult {
  startingXI: Player[];
  bench: Player[];
  captain: Player | null;
  viceCaptain: Player | null;
  totalPrice: number;
  totalPoints: number;
  formation: FormationType;
}

interface WasmOptimizedPlayer {
  player_id: string;
  name: string;
  team_id: string;
  position: PositionType;
  price: number;
  expected_points: number;
}

interface WasmSquadOptimizationResult {
  budget: number;
  total_cost: number;
  remaining_budget: number;
  formation: FormationType;
  expected_points: number;
  projection_coverage: { total: number; projected: number; missing: number };
  captain: string;
  vice_captain: string;
  lineup: WasmOptimizedPlayer[];
  bench: WasmOptimizedPlayer[];
}

interface WasmError {
  kind: string;
  message: string;
}

const MAX_PLAYERS_PER_TEAM = 3;
const CAPTAIN_MULTIPLIER = 2;

function toPlayer(optimized: WasmOptimizedPlayer): Player {
  return {
    id: optimized.player_id,
    name: optimized.name,
    team_id: optimized.team_id,
    position: optimized.position,
    price: optimized.price,
  };
}

function toJsError(error: unknown): Error {
  const wasmError = error as Partial<WasmError> | undefined;
  if (wasmError && typeof wasmError.message === 'string') {
    return new Error(wasmError.message);
  }
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Bütçe, formasyon ve takım kısıtları altında matematiksel olarak en iyi 15
 * kişilik kadroyu bulur. Hesaplama Rust'ta (`optimize_squad_with_options`)
 * yapılır ve WebAssembly üzerinden çağrılır — bkz. `crates/wasm-bindings`.
 */
export async function runOptimizer(
  players: Player[],
  projections: Map<string, ProjectionItem>,
  budget: number,
  selectedFormation: FormationType
): Promise<OptimizationResult> {
  const namedProjections = Array.from(projections.values()).map((projection) => ({
    player_id: projection.player_id,
    expected_points: projection.expected_points,
  }));
  const formation = selectedFormation === 'Auto' ? undefined : selectedFormation;

  let result: WasmSquadOptimizationResult;
  try {
    result = (await optimizeSquadInWorker(
      players,
      namedProjections,
      budget,
      formation,
      MAX_PLAYERS_PER_TEAM,
      CAPTAIN_MULTIPLIER
    )) as WasmSquadOptimizationResult;
  } catch (error) {
    throw toJsError(error);
  }

  const startingXI = result.lineup.map(toPlayer);
  const bench = result.bench.map(toPlayer);
  const captain = startingXI.find((player) => player.id === result.captain) ?? null;
  const viceCaptain = startingXI.find((player) => player.id === result.vice_captain) ?? null;

  return {
    startingXI,
    bench,
    captain,
    viceCaptain,
    totalPrice: result.total_cost,
    totalPoints: result.expected_points,
    formation: result.formation,
  };
}
