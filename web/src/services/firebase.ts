import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your web app's Firebase configuration
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

// Initialize Analytics conditionally (only in browser environment)
export const initAnalytics = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};
