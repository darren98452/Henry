import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, increment, collection, query, where, getDocs, orderBy, limit, documentId } from "firebase/firestore";
import { getAuth } from "firebase/auth";

import { WORD_BANK } from '../database/words';
import type { PracticeSession, Settings, UserData, Word, QuizQuestion, SwipeItem, User } from '../types';
import { calculateKnowledgeState } from './geminiService';

// --- FIREBASE INITIALIZATION ---
// IMPORTANT: PASTE YOUR FIREBASE CONFIGURATION HERE
// To get your Firebase config:
// 1. Go to your Firebase project in the Firebase console.
// 2. In the project overview, click the Web icon (</>) to add a web app or see your existing one.
// 3. Copy the firebaseConfig object and paste it below.
const firebaseConfig = {
  apiKey: ">>>>>>>your_api_key_here<<<<<<",
  authDomain: ">>>>>>>>>your_auth_domain_here<<<<<<",
  projectId: ">>>>>>>your_project_id_here<<<<<<",
  storageBucket: ">>>>>>>>your_storage_bucket_here<<<<<<",
  messagingSenderId: ">>>>>>>your_messaging_sender_id_here<<<<<<",
  appId: ">>>>>>>>>>your_app_id_here<<<<<<",
  measurementId: ">>>>>>>your_measurement_id_here<<<<<<"
};

// Validate the Firebase configuration to prevent runtime errors.
if (firebaseConfig.apiKey === "YOUR_API_KEY" || firebaseConfig.projectId === "YOUR_PROJECT_ID") {
  console.warn(
    'Firebase is not configured. Please add your project configuration to services/apiService.ts. The app will not function correctly.'
  );
  // We don't throw an error here to allow the app to load, but Firebase will fail to initialize.
}


// FIX: Use named import for firebase/app
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export const auth = getAuth(app);


// --- KNOWLEDGE TRACING & SRS LOGIC (Fallback Heuristic) ---
// This acts as a fallback if the AI Python execution fails.
const calculateMasteryFallback = (history: { quality: number, timestamp: string }[]): number => {
    if (history.length === 0) return 0.1;
    let mastery = 0.5;
    const now = Date.now();
    for (const interaction of history) {
        const quality = interaction.quality;
        const timestamp = new Date(interaction.timestamp).getTime();
        const daysAgo = (now - timestamp) / (1000 * 60 * 60 * 24);
        const recencyWeight = Math.pow(0.95, daysAgo);
        if (quality >= 3) {
            const increment = (0.1 + (quality - 3) * 0.05) * recencyWeight;
            mastery += increment;
        } else {
            const decrement = (0.2 - quality * 0.05) * recencyWeight; 
            mastery -= decrement;
        }
    }
    return Math.max(0.05, Math.min(1.0, mastery));
};

const calculateNextIntervalFallback = (mastery: number, repetition: number): number => {
    if (mastery < 0.4) return 1;
    const baseInterval = Math.pow(repetition + 1, 2.2);
    const masteryMultiplier = 1 + (mastery - 0.4) * 15;
    let interval = Math.ceil(baseInterval * masteryMultiplier);
    return Math.min(interval, 365); 
};


// --- FIRESTORE API SERVICE ---
const api = {
    async getUserData(userId: string, displayName: string | null): Promise<UserData> {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            return userDoc.data() as UserData;
        } else {
            // Create a new document for a new user
            const defaultData: UserData = {
                words: WORD_BANK.slice(0, 7),
                bookmarkedWords: [],
                quizStats: { totalCorrect: 0, totalAnswered: 0 },
                settings: { theme: 'lavender', userName: displayName || 'Learner', hasAcceptedDisclaimer: false },
                friendIds: [],
                practiceHistory: [],
                wordsLearned: 0,
            };
            await setDoc(userDocRef, defaultData);
            return defaultData;
        }
    },

    async generateNewWords(userId: string, currentWords: Word[]): Promise<Word[]> {
        const userWords = new Set(currentWords.map(w => w.word));
        const newWords = WORD_BANK.filter(w => !userWords.has(w.word)).slice(0, 5);
        if (newWords.length > 0) {
            const userDocRef = doc(db, "users", userId);
            await updateDoc(userDocRef, {
                words: arrayUnion(...newWords.map(w => ({...w}))) // Use copies
            });
        }
        return newWords;
    },

    async recordInteraction(userId: string, wordIdentifier: string, quality: number): Promise<UserData> {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) throw new Error("User data not found for interaction.");
        
        let userData = userDoc.data() as UserData;
        const wordIndex = userData.words.findIndex(w => w.word === wordIdentifier);
        if (wordIndex === -1) throw new Error(`Word "${wordIdentifier}" not found in user data.`);

        const word = userData.words[wordIndex];
        const wasNewWord = !word.srsData;

        let srsData = word.srsData || {
            lastReviewed: new Date().toISOString(), nextReview: new Date().toISOString(),
            interval: 1, easeFactor: 2.5, repetition: 0, mastery: 0.1, history: [],
        };

        // Add current interaction to history
        srsData.history.push({ quality, timestamp: new Date().toISOString() });
        srsData.lastReviewed = new Date().toISOString();

        // --- AI KNOWLEDGE TRACING ---
        // Try to use Gemini to execute the Python SAKT model
        try {
            const aiResult = await calculateKnowledgeState(word.word, srsData.history);
            
            if (aiResult) {
                srsData.mastery = aiResult.mastery;
                srsData.interval = aiResult.interval;
                srsData.repetition = aiResult.repetition;
            } else {
                // Fallback to local heuristic if AI returns null
                throw new Error("AI returned null");
            }
        } catch (e) {
            console.log("Using fallback SAKT heuristic due to:", e);
            // Fallback Logic
            srsData.mastery = calculateMasteryFallback(srsData.history);
            if (quality >= 3) {
                srsData.repetition += 1;
            } else {
                srsData.repetition = 0;
            }
            srsData.interval = calculateNextIntervalFallback(srsData.mastery, srsData.repetition);
        }

        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + srsData.interval);
        srsData.nextReview = nextReviewDate.toISOString();
        word.srsData = srsData;

        // Create updated data object to be sent to Firestore
        const newWordsArray = [...userData.words];
        newWordsArray[wordIndex] = word;
        
        const updatedData = {
            words: newWordsArray,
            'quizStats.totalAnswered': increment(1),
            'quizStats.totalCorrect': quality >= 3 ? increment(1) : increment(0),
            'wordsLearned': wasNewWord ? increment(1) : increment(0),
        };

        await updateDoc(userDocRef, updatedData);
        
        // Return the full, updated user data for local state
        userData.words = newWordsArray;
        userData.quizStats.totalAnswered += 1;
        if (quality >= 3) userData.quizStats.totalCorrect += 1;
        if (wasNewWord) userData.wordsLearned +=1;
        
        return userData;
    },
    
    async toggleBookmark(userId: string, wordIdentifier: string, isCurrentlyBookmarked: boolean): Promise<void> {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, {
            bookmarkedWords: isCurrentlyBookmarked
                ? arrayRemove(wordIdentifier)
                : arrayUnion(wordIdentifier)
        });
    },

    async addPracticeSession(userId: string, session: Omit<PracticeSession, 'id' | 'date'>): Promise<PracticeSession[]> {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) throw new Error("User not found.");

        const newSession: PracticeSession = { ...session, id: `${Date.now()}-${Math.random()}`, date: new Date().toISOString() };
        const currentHistory = userDoc.data().practiceHistory || [];
        const newHistory = [newSession, ...currentHistory].slice(0, 50);

        await updateDoc(userDocRef, { practiceHistory: newHistory });
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
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, {
            words: arrayUnion(word)
        });
    },

    async getFriends(friendIds: string[]): Promise<User[]> {
        if (friendIds.length === 0) return [];
        const usersRef = collection(db, "users");
        // Firestore 'in' query is limited (currently 30), for a production app with many friends, batching would be needed.
        const q = query(usersRef, where(documentId(), 'in', friendIds.slice(0, 30)));
        const querySnapshot = await getDocs(q);
        
        const friends: User[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as UserData;
            friends.push({
                id: doc.id,
                name: data.settings.userName,
                wordsLearned: data.wordsLearned,
                avatarUrl: `https://picsum.photos/seed/${doc.id}/48/48`,
            });
        });
        return friends.sort((a, b) => b.wordsLearned - a.wordsLearned);
    },
    
    async getLeagueUsers(minWords: number, maxWords: number | null): Promise<User[]> {
        const usersRef = collection(db, "users");
        let q;
        // This query requires a composite index in Firestore.
        // Firestore will provide a link to create it in the console error when first run.
        if (maxWords !== null) {
            q = query(usersRef, 
                where('wordsLearned', '>=', minWords), 
                where('wordsLearned', '<', maxWords),
                orderBy('wordsLearned', 'desc'),
                limit(50)
            );
        } else {
            q = query(usersRef, 
                where('wordsLearned', '>=', minWords),
                orderBy('wordsLearned', 'desc'),
                limit(50)
            );
        }

        const querySnapshot = await getDocs(q);
        const users: User[] = [];
        querySnapshot.forEach((doc) => {
             const data = doc.data() as UserData;
             users.push({
                id: doc.id,
                name: data.settings.userName,
                wordsLearned: data.wordsLearned,
                avatarUrl: `https://picsum.photos/seed/${doc.id}/48/48`,
            });
        });
        return users;
    },
};

export default api;


// --- GAME LOGIC ---
export const generateQuiz = (words: Word[]): QuizQuestion[] => {
    return words.map(word => {
        const distractors = WORD_BANK.filter(w => w.word !== word.word).sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [word.word, ...distractors.map(d => d.word)].sort(() => 0.5 - Math.random());
        return {
            word: word.word,
            definition: word.definition,
            options,
            correctAnswer: word.word,
            explanation: `"${word.word}" means "${word.definition}".`
        };
    });
};

export const generateSynonymPair = (wordPool: Word[]): SwipeItem => {
    const areSynonyms = Math.random() > 0.5;
    const pool = wordPool.length > 20 ? wordPool : WORD_BANK;
    const word1 = pool[Math.floor(Math.random() * pool.length)];
    let word2: { word: string };

    if (areSynonyms && word1.synonyms.length > 0) {
        const synonym = word1.synonyms[Math.floor(Math.random() * word1.synonyms.length)];
        word2 = WORD_BANK.find(w => w.word.toLowerCase() === synonym.toLowerCase()) || { word: synonym };
    } else {
        const otherWords = pool.filter(w => w.word !== word1.word && !word1.synonyms.includes(w.word));
        word2 = otherWords.length > 0
            ? otherWords[Math.floor(Math.random() * otherWords.length)]
            : WORD_BANK.filter(w => w.word !== word1.word && !word1.synonyms.includes(w.word))[Math.floor(Math.random() * (WORD_BANK.length - 1))];
    }

    return { word1: word1.word, word2: (word2 as Word).word, areSynonyms };
};