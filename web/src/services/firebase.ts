import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDawFgZ-HOfvFcLHr9opmxKsImhPcykhPc",
  authDomain: "superlig-fantasy-optimizer.firebaseapp.com",
  projectId: "superlig-fantasy-optimizer",
  storageBucket: "superlig-fantasy-optimizer.firebasestorage.app",
  messagingSenderId: "453181602868",
  appId: "1:453181602868:web:c26ac13d00af084f845e61"
};

// Initialize Firebase safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics conditionally
export const initAnalytics = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

// Initialize Performance Monitoring conditionally
export const initPerformance = async () => {
  if (typeof window !== 'undefined') {
    try {
      const { getPerformance } = await import('firebase/performance');
      return getPerformance(app);
    } catch {
      return null;
    }
  }
  return null;
};

export interface FeatureSuggestion {
  title: string;
  suggestion: string;
  contact?: string;
}

/**
 * Submit user feature suggestion directly to Firestore
 */
export const submitFeatureSuggestion = async (data: FeatureSuggestion): Promise<void> => {
  const cleanTitle = data.title.trim();
  const cleanSuggestion = data.suggestion.trim();
  if (!cleanTitle || !cleanSuggestion) {
    throw new Error('Başlık ve öneri alanı zorunludur.');
  }

  const suggestionsRef = collection(db, 'feature_suggestions');
  await addDoc(suggestionsRef, {
    title: cleanTitle,
    suggestion: cleanSuggestion,
    contact: data.contact?.trim() || null,
    createdAt: serverTimestamp(),
    status: 'pending',
    source: 'web_app',
  });
};
