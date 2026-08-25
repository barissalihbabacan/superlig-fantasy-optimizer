import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

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

// Initialize Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics conditionally
export const initAnalytics = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const loginWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google ile giriş hatası:', error);
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Çıkış yapma hatası:', error);
    throw error;
  }
};

export interface ChatMessage {
  id: string;
  topicId: string; // 'global' | `match_${fixtureId}` | `player_${playerId}`
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: Date;
  teamId?: string;
}

/**
 * Real-time listener for topic-based chat messages
 */
export const subscribeToChat = (
  topicId: string,
  onMessages: (messages: ChatMessage[]) => void,
  maxLimit: number = 60
) => {
  const messagesRef = collection(db, 'community_chats');
  const q = query(
    messagesRef,
    where('topicId', '==', topicId),
    orderBy('createdAt', 'asc'),
    limit(maxLimit)
  );

  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      const rawDate = data.createdAt;
      let createdAt = new Date();
      if (rawDate instanceof Timestamp) {
        createdAt = rawDate.toDate();
      } else if (rawDate && typeof rawDate.toDate === 'function') {
        createdAt = rawDate.toDate();
      }

      return {
        id: doc.id,
        topicId: data.topicId || topicId,
        userId: data.userId || 'anonymous',
        userName: data.userName || 'Futbolsever',
        userPhoto: data.userPhoto || '',
        text: data.text || '',
        createdAt,
        teamId: data.teamId,
      };
    });
    onMessages(messages);
  }, (error) => {
    console.error(`Sohbet mesajları dinlenirken hata (${topicId}):`, error);
  });
};

/**
 * Send a message to a topic
 */
export const sendChatMessage = async (
  topicId: string,
  text: string,
  user: { uid: string; displayName: string | null; photoURL: string | null },
  teamId?: string
) => {
  const cleanText = text.trim();
  if (!cleanText) return;

  const messagesRef = collection(db, 'community_chats');
  await addDoc(messagesRef, {
    topicId,
    userId: user.uid,
    userName: user.displayName || 'Futbolsever',
    userPhoto: user.photoURL || '',
    text: cleanText,
    teamId: teamId || null,
    createdAt: serverTimestamp(),
  });
};
