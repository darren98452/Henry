import { useMemo, useContext } from 'react';
import type { UserProgress } from '../types';
import { RANKS } from '../constants';
import { UserContext } from '../contexts/UserContext';

export const useVocabulary = () => {
    const { userData, recordQuizResult, toggleBookmark, fetchNewWords, isLoading, error } = useContext(UserContext);

    // If data is not yet loaded, return a default/empty state to prevent errors in components
    if (!userData) {
        return {
            allWords: [],
            wordsToLearn: [],
            learnedWords: new Set(),
            learnedWordsList: [],
            wordsToReview: [],
            bookmarkedWords: new Set(),
            bookmarkedWordsList: [],
            progress: {
                wordsLearned: 0,
                accuracy: 0,
                rank: RANKS[0],
            },
            toggleBookmark: async () => {},
            recordQuizResult: async () => {},
            fetchNewWords: async () => {},
            isLoading,
            error,
        };
    }

    const { words, bookmarkedWords: bookmarkedWordStrings, quizStats } = userData;
    const bookmarkedWords = useMemo(() => new Set(bookmarkedWordStrings), [bookmarkedWordStrings]);
    
    const learnedWordsList = useMemo(() => words.filter(w => w.srsData), [words]);
    const learnedWords = useMemo(() => new Set(learnedWordsList.map(w => w.word)), [learnedWordsList]);
    
    const wordsToLearn = useMemo(() => words.filter(w => !w.srsData), [words]);
    
    const wordsToReview = useMemo(() => {
        const today = new Date();
        return learnedWordsList.filter(w => w.srsData && new Date(w.srsData.nextReview) <= today);
    }, [learnedWordsList]);
    
    const bookmarkedWordsList = useMemo(() => {
        return words.filter(word => bookmarkedWords.has(word.word));
    }, [words, bookmarkedWords]);


    const progress: UserProgress = useMemo(() => {
        const accuracy = quizStats.totalAnswered > 0 ? Math.round((quizStats.totalCorrect / quizStats.totalAnswered) * 100) : 0;
        const wordsLearnedCount = learnedWords.size;
        const currentRank = [...RANKS].reverse().find(rank => wordsLearnedCount >= rank.minWords) || RANKS[0];
        return {
            wordsLearned: wordsLearnedCount,
            accuracy,
            rank: currentRank,
        };
    }, [learnedWords.size, quizStats]);


    return {
        allWords: words,
        wordsToLearn,
        learnedWords,
        learnedWordsList,
        wordsToReview,
        bookmarkedWords,
        bookmarkedWordsList,
        progress,
        toggleBookmark,
        recordQuizResult,
        fetchNewWords,
        isLoading,
        error,
    };
};

export type UseVocabularyReturn = ReturnType<typeof useVocabulary>;
