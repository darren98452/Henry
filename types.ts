import type { LucideProps } from 'lucide-react';
import type React from 'react';
// FIX: Import the `Settings` type so it is available within this module, then re-export it.
import type { Settings as AppSettings } from './hooks/useSettings';

export type Settings = AppSettings & {
  hasAcceptedDisclaimer: boolean;
};


export interface SrsInteraction {
  timestamp: string; // ISO date string
  quality: number; // The 0-5 rating from the user
}

export interface SrsData {
  lastReviewed: string; // ISO date string
  nextReview: string; // ISO date string
  interval: number; // in days
  easeFactor: number; // Maintained for potential alternative algorithms
  repetition: number;
  
  // New SAKT-inspired fields
  mastery: number; // A score from 0 to 1 representing knowledge strength
  history: SrsInteraction[];
}

export interface Word {
  word: string;
  pronunciation: string;
  definition: string;
  example: string;
  synonyms: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  srsData?: SrsData;
}

export interface UserProgress {
  wordsLearned: number;
  accuracy: number;
  rank: Rank;
}

export interface Rank {
  name: 'Copper' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  icon: React.FC<{ className?: string }>;
  minWords: number;
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.FC<LucideProps>;
}

export interface QuizQuestion {
  word: string;
  definition: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface SwipeItem {
    word1: string;
    word2: string;
    areSynonyms: boolean;
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  wordsLearned: number;
  isCurrentUser?: boolean;
}

export interface PracticeSession {
  id: string;
  type: 'Quiz' | 'Synonym Swipe' | 'Word Scramble' | 'Spelling Bee' | 'Wordle';
  score: number;
  total: number;
  date: string; // ISO date string
}

export interface UserData {
  words: Word[];
  bookmarkedWords: string[];
  quizStats: {
    totalCorrect: number;
    totalAnswered: number;
  };
  settings: Settings;
  friendIds: string[];
  practiceHistory: PracticeSession[];
  wordsLearned: number;
}