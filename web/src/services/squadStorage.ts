import { OptimizationResult } from './optimizer';
import { FormationType } from '../types';

const IDB_NAME = 'SuperLigFantasyDB';
const IDB_STORE = 'squad_data';
const STORAGE_KEY = 'superlig_optimized_squad_v1';

export interface SavedSquadData {
  result: OptimizationResult;
  formation: FormationType;
  savedAt: string;
}

// In-memory fallback
let memoryBackup: SavedSquadData | null = null;

// --- IndexedDB Helper ---
const openIDB = (): Promise<IDBDatabase | null> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(IDB_NAME, 2);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
        if (!db.objectStoreNames.contains('nostradamus_data')) {
          db.createObjectStore('nostradamus_data');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

export const saveOptimizedSquad = async (
  result: OptimizationResult,
  formation: FormationType
): Promise<void> => {
  const data: SavedSquadData = {
    result,
    formation,
    savedAt: new Date().toISOString(),
  };

  memoryBackup = data;

  // 1. Save to LocalStorage (synchronous backup)
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (e) {
    console.warn('LocalStorage squad write error:', e);
  }

  // 2. Save to IndexedDB (persistent storage)
  try {
    const db = await openIDB();
    if (!db) return;
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(data, 'latest_optimized_squad');
  } catch (e) {
    console.warn('IndexedDB squad write error:', e);
  }
};

export const loadOptimizedSquad = async (): Promise<SavedSquadData | null> => {
  // 1. Try loading from IndexedDB
  try {
    const db = await openIDB();
    if (db) {
      const idbData = await new Promise<SavedSquadData | null>((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get('latest_optimized_squad');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });

      if (idbData && idbData.result) {
        return idbData;
      }
    }
  } catch (e) {
    console.warn('IndexedDB squad read error:', e);
  }

  // 2. Fallback to LocalStorage
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.result) {
          return parsed as SavedSquadData;
        }
      }
    }
  } catch (e) {
    console.warn('LocalStorage squad read error:', e);
  }

  // 3. Fallback to in-memory
  return memoryBackup;
};

export const clearOptimizedSquad = async (): Promise<void> => {
  memoryBackup = null;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    const db = await openIDB();
    if (db) {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete('latest_optimized_squad');
    }
  } catch (e) {
    console.warn('Clear squad error:', e);
  }
};
