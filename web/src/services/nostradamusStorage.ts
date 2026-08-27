// Dual Persistent Storage Service (LocalStorage + IndexedDB + Built-in Fallbacks) for Nostradamus Game

export type PredictionType = '1' | 'X' | '2';

export interface WeeklyPredictions {
  [fixtureId: string]: PredictionType;
}

export interface AllPredictions {
  [round: number]: WeeklyPredictions;
}

export interface MatchResultOverride {
  status: 'finished' | 'scheduled' | 'live';
  score?: { home: number; away: number };
}

export interface MatchResultsStore {
  [fixtureId: string]: MatchResultOverride;
}

const PREDICTIONS_KEY = 'superlig_nostradamus_predictions_v3';
const RESULTS_KEY = 'superlig_nostradamus_results_v3';
const IDB_NAME = 'SuperLigFantasyDB';
const IDB_STORE = 'nostradamus_data';

// BULGU 2 düzeltmesi: bu, tek bir kişinin gerçek 1. hafta kuponuydu ve önceki
// sürümde `loadAllPredictions` her boş/yeni kullanıcıya bunu otomatik olarak
// "kendi tahminiymiş" gibi enjekte edip gerçek sonuçlarla karşılaştırıyor,
// kullanıcıya ait olmayan bir "doğru tahmin" skoru gösteriyordu. Artık
// otomatik enjekte edilmiyor (bkz. `loadAllPredictions` ve migration mantığı
// aşağıda) — yalnızca referans veri olarak ve testlerde kalıyor.
export const DEFAULT_W1_PREDICTIONS: WeeklyPredictions = {
  '2026-27-w01-01': '1', // Galatasaray vs Çorum FK -> Galatasaray kazanır (MS 1)
  '2026-27-w01-02': '2', // Konyaspor vs Rizespor -> Rizespor kazanır (MS 2)
  '2026-27-w01-03': 'X', // Gaziantep FK vs Alanyaspor -> Beraberlik (X)
  '2026-27-w01-04': '2', // Gençlerbirliği vs Fenerbahçe -> Fenerbahçe kazanır (MS 2)
  '2026-27-w01-05': '2', // Kasımpaşa vs Trabzonspor -> Trabzonspor kazanır (MS 2)
  '2026-27-w01-06': '1', // Beşiktaş vs Eyüpspor -> Beşiktaş kazanır (MS 1)
  '2026-27-w01-07': '2', // Amed SK vs Erzurumspor FK -> Erzurumspor kazanır (MS 2)
  '2026-27-w01-08': '1', // Başakşehir vs Kocaelispor -> Başakşehir kazanır (MS 1)
  '2026-27-w01-09': '1', // Samsunspor vs Göztepe -> Samsunspor kazanır (MS 1)
};

// Default match results override
const DEFAULT_RESULTS: MatchResultsStore = {
  '2026-27-w01-01': { status: 'finished', score: { home: 2, away: 2 } },
  '2026-27-w01-02': { status: 'finished', score: { home: 0, away: 1 } },
  '2026-27-w01-03': { status: 'finished', score: { home: 1, away: 1 } },
  '2026-27-w01-04': { status: 'finished', score: { home: 2, away: 1 } },
  '2026-27-w01-05': { status: 'finished', score: { home: 1, away: 1 } },
  '2026-27-w01-06': { status: 'finished', score: { home: 1, away: 0 } },
  '2026-27-w01-07': { status: 'finished', score: { home: 3, away: 0 } },
  '2026-27-w01-08': { status: 'finished', score: { home: 2, away: 0 } },
  '2026-27-w01-09': { status: 'finished', score: { home: 3, away: 3 } },
};

// --- IndexedDB Helper ---
const openIDB = (): Promise<IDBDatabase | null> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

const saveToIDB = async (key: string, value: unknown) => {
  try {
    const db = await openIDB();
    if (!db) return;
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
  } catch (e) {
    console.warn('IDB write error:', e);
  }
};

function predictionsEqual(a: WeeklyPredictions, b: WeeklyPredictions): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => a[key] === b[key]);
}

// --- Load Predictions (LocalStorage + Fallback) ---
export const loadAllPredictions = (): AllPredictions => {
  let all: AllPredictions = {};

  try {
    // Check v3 key first, then fallback to previous keys if existed
    const raw =
      localStorage.getItem(PREDICTIONS_KEY) ||
      localStorage.getItem('superlig_nostradamus_predictions_v2') ||
      localStorage.getItem('superlig_nostradamus_predictions_v1');

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        all = parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to read predictions from localStorage:', e);
  }

  // Tek seferlik geriye dönük temizlik: eski sürüm, her boş/yeni kullanıcıya
  // round 1'i otomatik olarak DEFAULT_W1_PREDICTIONS ile dolduruyordu. Bir
  // kullanıcının organik olarak tüm 9 maçta da bu tam kombinasyonu seçmesi
  // istatistiksel olarak ihmal edilebilir (3^9 olası kupondan 1'i), bu yüzden
  // kayıtlı round 1 verisi bu varsayılan kümeyle birebir aynıysa bunun eski
  // otomatik enjeksiyondan kaldığını kabul edip temizliyoruz. Gerçekten kendi
  // tahminini yapmış — hatta tamamen aynısını seçmiş olsa bile farklı bir tek
  // maçta bile ayrışan — bir kullanıcının verisi bundan etkilenmez.
  if (all[1] && predictionsEqual(all[1], DEFAULT_W1_PREDICTIONS)) {
    delete all[1];
    try {
      localStorage.setItem(PREDICTIONS_KEY, JSON.stringify(all));
      saveToIDB(PREDICTIONS_KEY, all);
    } catch (e) {
      console.warn(e);
    }
  }

  return all;
};

// --- Save Predictions ---
export const saveWeeklyPredictions = (round: number, predictions: WeeklyPredictions): void => {
  try {
    const all = loadAllPredictions();
    all[round] = predictions;
    localStorage.setItem(PREDICTIONS_KEY, JSON.stringify(all));
    saveToIDB(PREDICTIONS_KEY, all);
  } catch (e) {
    console.error('Failed to save predictions to storage:', e);
  }
};

// --- Load Match Results ---
export const loadMatchResultsOverrides = (): MatchResultsStore => {
  try {
    const raw =
      localStorage.getItem(RESULTS_KEY) ||
      localStorage.getItem('superlig_nostradamus_results_v2') ||
      localStorage.getItem('superlig_nostradamus_results_v1');

    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_RESULTS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to read match results from localStorage:', e);
  }
  return DEFAULT_RESULTS;
};

// --- Save Match Results ---
export const saveMatchResultsOverride = (fixtureId: string, result: MatchResultOverride): void => {
  try {
    const current = loadMatchResultsOverrides();
    current[fixtureId] = result;
    localStorage.setItem(RESULTS_KEY, JSON.stringify(current));
    saveToIDB(RESULTS_KEY, current);
  } catch (e) {
    console.error('Failed to save match result to storage:', e);
  }
};
