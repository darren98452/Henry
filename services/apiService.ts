/**
 * apiService.ts  (updated)
 *
 * Changes from original:
 *  1. Import `calculateKnowledgeState` from `./saktService` instead of
 *     `./geminiService`.  Everything else is identical.
 *  2. The `generateQuiz` and `generateSynonymPair` game helpers are
 *     unchanged and remain at the bottom of this file.
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc,
  arrayUnion, arrayRemove, increment,
  collection, query, where, getDocs, orderBy, limit, documentId,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

import { WORD_BANK } from '../database/words';
import type { PracticeSession, Settings, UserData, Word, QuizQuestion, SwipeItem, User } from '../types';

// ─── 🔄 CHANGED: import from saktService, not geminiService ───────────────
import { calculateKnowledgeState } from './saktService';
// ──────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE INITIALISATION
// Paste your Firebase project config here (or load from env vars).
// ─────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env?.VITE_FIREBASE_API_KEY            ?? ">>>>>>>your_api_key_here<<<<<<",
  authDomain:        import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN        ?? ">>>>>>>>>your_auth_domain_here<<<<<<",
  projectId:         import.meta.env?.VITE_FIREBASE_PROJECT_ID         ?? ">>>>>>>your_project_id_here<<<<<<",
  storageBucket:     import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET     ?? ">>>>>>>>your_storage_bucket_here<<<<<<",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID ?? ">>>>>>>your_messaging_sender_id_here<<<<<<",
  appId:             import.meta.env?.VITE_FIREBASE_APP_ID             ?? ">>>>>>>>>>your_app_id_here<<<<<<",
  measurementId:     import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID     ?? ">>>>>>>your_measurement_id_here<<<<<<",
};

if (
  firebaseConfig.apiKey === ">>>>>>>your_api_key_here<<<<<<"  ||
  firebaseConfig.projectId === ">>>>>>>your_project_id_here<<<<<<"
) {
  console.warn(
    'Firebase is not configured. Add your config to services/apiService.ts ' +
    'or set VITE_FIREBASE_* environment variables.'
  );
}

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
export const auth = getAuth(app);


// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK HEURISTIC  (used when SAKT endpoint is unreachable)
// Identical to the original — kept as a safety net.
// ─────────────────────────────────────────────────────────────────────────────
const calculateMasteryFallback = (
  history: { quality: number; timestamp: string }[],
): number => {
  if (history.length === 0) return 0.1;
  let mastery = 0.5;
  const now   = Date.now();
  for (const { quality, timestamp } of history) {
    const daysAgo      = (now - new Date(timestamp).getTime()) / 86_400_000;
    const recencyWeight = Math.pow(0.95, daysAgo);
    if (quality >= 3) {
      mastery += (0.1 + (quality - 3) * 0.05) * recencyWeight;
    } else {
      mastery -= (0.2 - quality * 0.05) * recencyWeight;
    }
  }
  return Math.max(0.05, Math.min(1.0, mastery));
};

const calculateNextIntervalFallback = (mastery: number, repetition: number): number => {
  if (mastery < 0.4) return 1;
  const baseInterval      = Math.pow(repetition + 1, 2.2);
  const masteryMultiplier = 1 + (mastery - 0.4) * 15;
  return Math.min(Math.ceil(baseInterval * masteryMultiplier), 365);
};


// ─────────────────────────────────────────────────────────────────────────────
// FIRESTORE API SERVICE
// ─────────────────────────────────────────────────────────────────────────────
const api = {

  async getUserData(userId: string, displayName: string | null): Promise<UserData> {
    const ref = doc(db, "users", userId);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data() as UserData;

    const defaultData: UserData = {
      words: WORD_BANK.slice(0, 7),
      bookmarkedWords: [],
      quizStats: { totalCorrect: 0, totalAnswered: 0 },
      settings: {
        theme: 'lavender',
        userName: displayName ?? 'Learner',
        hasAcceptedDisclaimer: false,
      },
      friendIds: [],
      practiceHistory: [],
      wordsLearned: 0,
    };
    await setDoc(ref, defaultData);
    return defaultData;
  },

  async generateNewWords(userId: string, currentWords: Word[]): Promise<Word[]> {
    const existing = new Set(currentWords.map(w => w.word));
    const newWords = WORD_BANK.filter(w => !existing.has(w.word)).slice(0, 5);
    if (newWords.length > 0) {
      await updateDoc(doc(db, "users", userId), {
        words: arrayUnion(...newWords.map(w => ({ ...w }))),
      });
    }
    return newWords;
  },

  async recordInteraction(
    userId:         string,
    wordIdentifier: string,
    quality:        number,
  ): Promise<UserData> {
    const ref  = doc(db, "users", userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("User data not found.");

    let userData  = snap.data() as UserData;
    const wordIdx = userData.words.findIndex(w => w.word === wordIdentifier);
    if (wordIdx === -1) throw new Error(`Word "${wordIdentifier}" not found.`);

    const word       = userData.words[wordIdx];
    const wasNewWord = !word.srsData;

    let srsData = word.srsData ?? {
      lastReviewed: new Date().toISOString(),
      nextReview:   new Date().toISOString(),
      interval:     1,
      easeFactor:   2.5,
      repetition:   0,
      mastery:      0.1,
      history:      [],
    };

    srsData.history.push({ quality, timestamp: new Date().toISOString() });
    srsData.lastReviewed = new Date().toISOString();

    // ── SAKT inference ────────────────────────────────────────────────────
    try {
      const aiResult = await calculateKnowledgeState(word.word, srsData.history);

      if (aiResult) {
        srsData.mastery    = aiResult.mastery;
        srsData.interval   = aiResult.interval;
        srsData.repetition = aiResult.repetition;
      } else {
        throw new Error("SAKT returned null — using fallback");
      }
    } catch (e) {
      console.log("SAKT unavailable, using heuristic:", e);
      srsData.mastery = calculateMasteryFallback(srsData.history);
      srsData.repetition = quality >= 3 ? srsData.repetition + 1 : 0;
      srsData.interval   = calculateNextIntervalFallback(srsData.mastery, srsData.repetition);
    }
    // ─────────────────────────────────────────────────────────────────────

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + srsData.interval);
    srsData.nextReview = nextReview.toISOString();
    word.srsData       = srsData;

    const newWords = [...userData.words];
    newWords[wordIdx] = word;

    await updateDoc(ref, {
      words:                    newWords,
      'quizStats.totalAnswered': increment(1),
      'quizStats.totalCorrect':  quality >= 3 ? increment(1) : increment(0),
      wordsLearned:              wasNewWord    ? increment(1) : increment(0),
    });

    userData.words = newWords;
    userData.quizStats.totalAnswered += 1;
    if (quality >= 3)  userData.quizStats.totalCorrect += 1;
    if (wasNewWord)    userData.wordsLearned += 1;

    return userData;
  },

  async toggleBookmark(
    userId:               string,
    wordIdentifier:       string,
    isCurrentlyBookmarked: boolean,
  ): Promise<void> {
    await updateDoc(doc(db, "users", userId), {
      bookmarkedWords: isCurrentlyBookmarked
        ? arrayRemove(wordIdentifier)
        : arrayUnion(wordIdentifier),
    });
  },

  async addPracticeSession(
    userId:  string,
    session: Omit<PracticeSession, 'id' | 'date'>,
  ): Promise<PracticeSession[]> {
    const ref  = doc(db, "users", userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("User not found.");

    const newSession: PracticeSession = {
      ...session,
      id:   `${Date.now()}-${Math.random()}`,
      date: new Date().toISOString(),
    };
    const history    = snap.data().practiceHistory ?? [];
    const newHistory = [newSession, ...history].slice(0, 50);
    await updateDoc(ref, { practiceHistory: newHistory });
    return newHistory;
  },

  async clearPracticeHistory(userId: string): Promise<void> {
    await updateDoc(doc(db, "users", userId), { practiceHistory: [] });
  },

  async updateSettings(userId: string, settings: Settings): Promise<void> {
    await updateDoc(doc(db, "users", userId), { settings });
  },

  async addFriend(userId: string, friendId: string): Promise<void> {
    await updateDoc(doc(db, "users", userId), { friendIds: arrayUnion(friendId) });
  },

  async removeFriend(userId: string, friendId: string): Promise<void> {
    await updateDoc(doc(db, "users", userId), { friendIds: arrayRemove(friendId) });
  },

  async addCustomWord(userId: string, word: Word): Promise<void> {
    await updateDoc(doc(db, "users", userId), { words: arrayUnion(word) });
  },

  async getFriends(friendIds: string[]): Promise<User[]> {
    if (friendIds.length === 0) return [];
    const q    = query(
      collection(db, "users"),
      where(documentId(), 'in', friendIds.slice(0, 30)),
    );
    const snap = await getDocs(q);
    const out: User[] = [];
    snap.forEach(d => {
      const data = d.data() as UserData;
      out.push({
        id:           d.id,
        name:         data.settings.userName,
        wordsLearned: data.wordsLearned,
        avatarUrl:    `https://picsum.photos/seed/${d.id}/48/48`,
      });
    });
    return out.sort((a, b) => b.wordsLearned - a.wordsLearned);
  },

  async getLeagueUsers(minWords: number, maxWords: number | null): Promise<User[]> {
    const ref = collection(db, "users");
    const q   = maxWords !== null
      ? query(ref,
          where('wordsLearned', '>=', minWords),
          where('wordsLearned', '<',  maxWords),
          orderBy('wordsLearned', 'desc'),
          limit(50))
      : query(ref,
          where('wordsLearned', '>=', minWords),
          orderBy('wordsLearned', 'desc'),
          limit(50));

    const snap = await getDocs(q);
    const out: User[] = [];
    snap.forEach(d => {
      const data = d.data() as UserData;
      out.push({
        id:           d.id,
        name:         data.settings.userName,
        wordsLearned: data.wordsLearned,
        avatarUrl:    `https://picsum.photos/seed/${d.id}/48/48`,
      });
    });
    return out;
  },
};

export default api;


// ─────────────────────────────────────────────────────────────────────────────
// GAME HELPERS  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

export const generateQuiz = (words: Word[]): QuizQuestion[] =>
  words.map(word => {
    const distractors = WORD_BANK
      .filter(w => w.word !== word.word)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const options = [word.word, ...distractors.map(d => d.word)]
      .sort(() => 0.5 - Math.random());
    return {
      word:          word.word,
      definition:    word.definition,
      options,
      correctAnswer: word.word,
      explanation:   `"${word.word}" means "${word.definition}".`,
    };
  });

export const generateSynonymPair = (wordPool: Word[]): SwipeItem => {
  const areSynonyms = Math.random() > 0.5;
  const pool  = wordPool.length > 20 ? wordPool : WORD_BANK;
  const word1 = pool[Math.floor(Math.random() * pool.length)];
  let word2: { word: string };

  if (areSynonyms && word1.synonyms.length > 0) {
    const syn = word1.synonyms[Math.floor(Math.random() * word1.synonyms.length)];
    word2     = WORD_BANK.find(w => w.word.toLowerCase() === syn.toLowerCase()) ?? { word: syn };
  } else {
    const others = pool.filter(
      w => w.word !== word1.word && !word1.synonyms.includes(w.word),
    );
    word2 = others.length > 0
      ? others[Math.floor(Math.random() * others.length)]
      : WORD_BANK
          .filter(w => w.word !== word1.word && !word1.synonyms.includes(w.word))
          [Math.floor(Math.random() * (WORD_BANK.length - 1))];
  }

  return { word1: word1.word, word2: (word2 as Word).word, areSynonyms };
};
