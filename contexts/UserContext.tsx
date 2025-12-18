import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, type User as FirebaseUser } from "firebase/auth";
import type { UserData, Settings, PracticeSession, Word } from '../types';
import type { ThemeName } from '../hooks/useSettings';
import api, { auth } from '../services/apiService';

interface UserContextType {
  authUser: FirebaseUser | null;
  userData: UserData | null;
  isLoading: boolean;
  error: string | null;
  
  // Auth functions
  signIn: (email: string, pass: string) => Promise<any>;
  signUp: (email: string, pass: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<void>;
  
  // Data functions
  fetchNewWords: () => Promise<void>;
  toggleBookmark: (wordIdentifier: string) => Promise<void>;
  recordQuizResult: (wordIdentifier: string, quality: number) => Promise<void>;
  addPracticeSession: (sessionData: Omit<PracticeSession, 'id' | 'date'>) => Promise<void>;
  clearHistory: () => Promise<void>;
  setTheme: (theme: ThemeName) => Promise<void>;
  setUserName: (name: string) => Promise<void>;
  acceptDisclaimer: () => Promise<void>;
  addFriend: (id: string) => Promise<void>;
  removeFriend: (id: string) => Promise<void>;
  addCustomWord: (word: Word) => Promise<void>;
}

export const UserContext = createContext<UserContextType>({
    authUser: null,
    userData: null,
    isLoading: true, // Start loading on initial auth check
    error: null,
    signIn: async () => {},
    signUp: async () => {},
    signInWithGoogle: async () => {},
    signOut: async () => {},
    fetchNewWords: async () => {},
    toggleBookmark: async () => {},
    recordQuizResult: async () => {},
    addPracticeSession: async () => {},
    clearHistory: async () => {},
    setTheme: async () => {},
    setUserName: async () => {},
    acceptDisclaimer: async () => {},
    addFriend: async () => {},
    removeFriend: async () => {},
    addCustomWord: async () => {},
});

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Initially true to check auth status
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setIsLoading(true);
            if (user) {
                setAuthUser(user);
                try {
                    const data = await api.getUserData(user.uid, user.displayName);
                    setUserData(data);
                    setError(null);
                } catch (e) {
                    console.error(e);
                    setError("Failed to load your vocabulary data.");
                    setAuthUser(null);
                    setUserData(null);
                }
            } else {
                setAuthUser(null);
                setUserData(null);
                setError(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);
    
    const signIn = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
    const signUp = (email: string, pass:string) => createUserWithEmailAndPassword(auth, email, pass);
    const signInWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());
    const signOut = () => firebaseSignOut(auth);
    
    const fetchNewWords = useCallback(async () => {
        if (!userData || !authUser) return;
        try {
            const newWords = await api.generateNewWords(authUser.uid, userData.words);
            setUserData(d => d ? { ...d, words: [...d.words, ...newWords] } : null);
        } catch (e) { console.error("Failed to fetch new words", e); }
    }, [authUser, userData]);

    const recordQuizResult = useCallback(async (wordIdentifier: string, quality: number) => {
        if (!authUser || !userData) return;
        try {
            const updatedUserData = await api.recordInteraction(authUser.uid, wordIdentifier, quality);
            setUserData(updatedUserData);
        } catch (e) { console.error("Failed to record interaction", e); }
    }, [authUser, userData]);
    
    const toggleBookmark = useCallback(async (wordIdentifier: string) => {
        if (!userData || !authUser) return;
        
        const isCurrentlyBookmarked = userData.bookmarkedWords.includes(wordIdentifier);
        const newBookmarks = isCurrentlyBookmarked
            ? userData.bookmarkedWords.filter(w => w !== wordIdentifier)
            : [...userData.bookmarkedWords, wordIdentifier];

        setUserData(d => d ? { ...d, bookmarkedWords: newBookmarks } : null);
        
        try {
            await api.toggleBookmark(authUser.uid, wordIdentifier, isCurrentlyBookmarked);
        } catch (e) {
            setUserData(d => d ? { ...d, bookmarkedWords: userData.bookmarkedWords } : null); // Revert on fail
            console.error("Failed to toggle bookmark", e);
        }
    }, [authUser, userData]);
    
    const addPracticeSession = useCallback(async (sessionData: Omit<PracticeSession, 'id' | 'date'>) => {
        if (!userData || !authUser) return;
        try {
            const newHistory = await api.addPracticeSession(authUser.uid, sessionData);
            setUserData(d => d ? { ...d, practiceHistory: newHistory } : null);
        } catch (e) { console.error("Failed to add practice session", e); }
    }, [authUser, userData]);

    const clearHistory = useCallback(async () => {
        if (!userData || !authUser) return;
        const oldHistory = userData.practiceHistory;
        setUserData(d => d ? { ...d, practiceHistory: [] } : null);
        try { await api.clearPracticeHistory(authUser.uid); } 
        catch (e) {
             setUserData(d => d ? { ...d, practiceHistory: oldHistory } : null);
             console.error("Failed to clear history", e);
        }
    }, [authUser, userData]);
    
    const updateSettings = useCallback(async (newSettings: Settings) => {
        if (!userData || !authUser) return;
        const oldSettings = userData.settings;
        setUserData(d => d ? { ...d, settings: newSettings } : null);
        try { await api.updateSettings(authUser.uid, newSettings); } 
        catch (e) {
            setUserData(d => d ? { ...d, settings: oldSettings } : null);
            console.error("Failed to update settings", e);
        }
    }, [authUser, userData]);

    const setTheme = (theme: ThemeName) => {
        if(!userData) return Promise.resolve();
        return updateSettings({ ...userData.settings, theme });
    }
    const setUserName = (userName: string) => {
        if(!userData) return Promise.resolve();
        return updateSettings({ ...userData.settings, userName });
    }
    
    const acceptDisclaimer = useCallback(async () => {
        if (!userData) return;
        const newSettings = { ...userData.settings, hasAcceptedDisclaimer: true };
        await updateSettings(newSettings);
    }, [userData, updateSettings]);

    const updateFriends = useCallback(async (newFriendIds: string[]) => {
        if (!userData || !authUser) return;
        const oldFriends = userData.friendIds;
        setUserData(d => d ? { ...d, friendIds: newFriendIds } : null);
        try { 
            if(newFriendIds.length > oldFriends.length) { // Friend added
                const newFriendId = newFriendIds[newFriendIds.length - 1];
                await api.addFriend(authUser.uid, newFriendId);
            } else { // Friend removed
                const removedFriendId = oldFriends.find(id => !newFriendIds.includes(id));
                if (removedFriendId) await api.removeFriend(authUser.uid, removedFriendId);
            }
        }
        catch (e) { 
            setUserData(d => d ? { ...d, friendIds: oldFriends } : null);
            console.error("Failed to update friends", e);
        }
    }, [authUser, userData]);

    const addFriend = (id: string) => {
        if (!userData || userData.friendIds.includes(id)) return Promise.resolve();
        return updateFriends([...userData.friendIds, id]);
    };
    
    const removeFriend = (id: string) => {
        if (!userData) return Promise.resolve();
        return updateFriends(userData.friendIds.filter(friendId => friendId !== id));
    };

    const addCustomWord = useCallback(async (word: Word) => {
        if (!userData || !authUser) return;
        
        const oldWords = userData.words;
        const newWords = [...oldWords, word];
        setUserData(d => d ? { ...d, words: newWords } : null); // Optimistic update
        
        try {
            await api.addCustomWord(authUser.uid, word);
        } catch (e) {
            setUserData(d => d ? { ...d, words: oldWords } : null); // Revert on fail
            console.error("Failed to add custom word", e);
            throw e; // re-throw to inform the UI
        }
    }, [authUser, userData]);

    const value = {
        authUser, userData, isLoading, error, 
        signIn, signUp, signOut, signInWithGoogle,
        fetchNewWords, toggleBookmark, recordQuizResult, addPracticeSession,
        clearHistory, setTheme, setUserName, acceptDisclaimer, addFriend, removeFriend,
        addCustomWord,
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};