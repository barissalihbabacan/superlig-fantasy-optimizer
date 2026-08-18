/**
 * Süper Lig Fantasy squad optimizer'ı ayrı bir thread'de çalıştıran Web Worker.
 *
 * Rust'taki branch-and-bound araması, sezon başında (gerçek maç verisi henüz
 * yokken) oyuncuların büyük çoğunluğu aynı/sıfır expected_points değerine sahip
 * olduğunda puan bazlı budama işe yaramaz hale gelip aramayı neredeyse tam
 * kombinasyonel taramaya dönüştürebilir — bu da dakikalar sürebilir. Bu
 * hesaplamayı ana thread'de senkron çalıştırmak sekmeyi dondurur; bu yüzden
 * worker'a taşınır ve iptal edilebilir hale getirilir (bkz. optimizerWasm.ts).
 */
import init, { optimizeSquad } from '../../wasm-pkg/sfo_wasm.js';
import wasmUrl from '../../wasm-pkg/sfo_wasm_bg.wasm?url';

interface OptimizeRequest {
  id: number;
  players: unknown;
  projections: unknown;
  budgetUnits: number;
  formation: string | undefined;
  maxPlayersPerTeam: number;
  captainMultiplier: number;
}

interface OptimizeSuccess {
  id: number;
  ok: true;
  result: unknown;
}

interface OptimizeFailure {
  id: number;
  ok: false;
  error: { kind?: string; message: string };
}

// `self` burada bilerek `webworker` lib'i referans almadan, minimal bir
// şekilde tipleniyor — bu proje `dom` ve `webworker` lib'lerini aynı anda
// derlemiyor (ikisi aynı global adları çakışan şekilde tanımlar).
const ctx = self as unknown as {
  postMessage: (message: OptimizeSuccess | OptimizeFailure) => void;
  onmessage: ((event: MessageEvent<OptimizeRequest>) => void) | null;
};

let readyPromise: Promise<void> | null = null;

function ensureReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = init({ module_or_path: wasmUrl }).then(() => undefined);
  }
  return readyPromise;
}

ctx.onmessage = async (event) => {
  const { id, players, projections, budgetUnits, formation, maxPlayersPerTeam, captainMultiplier } =
    event.data;
  try {
    await ensureReady();
    const result = optimizeSquad(
      players,
      projections,
      budgetUnits,
      formation,
      maxPlayersPerTeam,
      captainMultiplier
    );
    ctx.postMessage({ id, ok: true, result });
  } catch (error) {
    const wasmError = error as Partial<{ kind: string; message: string }> | undefined;
    ctx.postMessage({
      id,
      ok: false,
      error: {
        kind: wasmError?.kind,
        message: typeof wasmError?.message === 'string' ? wasmError.message : String(error),
      },
    });
  }
};
