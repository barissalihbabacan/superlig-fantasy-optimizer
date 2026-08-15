/**
 * Optimizer worker'ının yaşam döngüsünü ve istek/yanıt eşleşmesini yönetir.
 * Gerçek hesaplama `optimizer.worker.ts` içinde, ayrı bir thread'de çalışır —
 * bkz. o dosyadaki not: bu, ana thread'i dondurmamak için gereklidir.
 */

export interface WasmError {
  kind?: string;
  message: string;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

interface WorkerResponse {
  id: number;
  ok: boolean;
  result?: unknown;
  error?: WasmError;
}

let worker: Worker | null = null;
let nextRequestId = 0;
const pending = new Map<number, PendingRequest>();

function rejectAllPending(error: Error): void {
  pending.forEach((request) => request.reject(error));
  pending.clear();
}

function createWorker(): Worker {
  const instance = new Worker(new URL('./optimizer.worker.ts', import.meta.url), {
    type: 'module',
  });
  instance.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const { id, ok, result, error } = event.data;
    const request = pending.get(id);
    if (!request) return;
    pending.delete(id);
    if (ok) {
      request.resolve(result);
    } else {
      request.reject(new Error(error?.message || 'Optimizasyon başarısız oldu.'));
    }
  };
  instance.onerror = (event: ErrorEvent) => {
    rejectAllPending(new Error(event.message || 'Optimizer worker beklenmedik şekilde durdu.'));
  };
  return instance;
}

function getWorker(): Worker {
  if (!worker) {
    worker = createWorker();
  }
  return worker;
}

/** Worker'ı önceden oluşturup wasm modülünü ısıtır (kullanıcı butona basmadan önce). */
export function initOptimizerWasm(): void {
  getWorker();
}

/** Devam eden optimizasyonu iptal eder; worker sonlandırılıp bir sonraki istekte yeniden oluşturulur. */
export function cancelOptimization(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  rejectAllPending(new Error('Optimizasyon iptal edildi.'));
}

export function optimizeSquadInWorker(
  players: unknown,
  projections: unknown,
  budgetUnits: number,
  formation: string | undefined,
  maxPlayersPerTeam: number,
  captainMultiplier: number
): Promise<unknown> {
  const id = nextRequestId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({
      id,
      players,
      projections,
      budgetUnits,
      formation,
      maxPlayersPerTeam,
      captainMultiplier,
    });
  });
}
