import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UseVocabularyReturn } from '../hooks/useVocabulary';
import type { PracticeSession } from '../types';
import Loader from './Loader';

interface WordleGameProps {
  vocabulary: UseVocabularyReturn;
  onFinish: () => void;
  addPracticeSession: (sessionData: Omit<PracticeSession, 'id' | 'date'>) => void;
}

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';
type GameState = 'playing' | 'won' | 'lost' | 'no-words';

const Keyboard: React.FC<{ onKeyPress: (key: string) => void; keyStatuses: { [key: string]: LetterStatus } }> = ({ onKeyPress, keyStatuses }) => {
    const rows = [
        "qwertyuiop".split(''),
        "asdfghjkl".split(''),
        ['Enter', ..."zxcvbnm".split(''), 'Backspace']
    ];

    return (
        <div className="space-y-1.5 mt-4">
            {rows.map((row, i) => (
                <div key={i} className="flex justify-center space-x-1.5">
                    {row.map(key => {
                        const status = keyStatuses[key] || 'empty';
                        const statusClasses = {
                            correct: 'bg-success text-white',
                            present: 'bg-warning text-white',
                            absent: 'bg-neutral/40 text-white',
                            empty: 'bg-base-300'
                        }[status];
                        
                        return (
                            <button
                                key={key}
                                onClick={() => onKeyPress(key)}
                                className={`h-12 flex-1 rounded-md font-semibold uppercase text-xs sm:text-base transition-colors ${statusClasses}`}
                            >
                                {key === 'Backspace' ? '⌫' : key}
                            </button>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

const WordleGame: React.FC<WordleGameProps> = ({ vocabulary, onFinish, addPracticeSession }) => {
    const [secretWord, setSecretWord] = useState<string | null>(null);
    const [guesses, setGuesses] = useState<string[]>(Array(MAX_GUESSES).fill(''));
    const [currentGuessIndex, setCurrentGuessIndex] = useState(0);
    const [gameState, setGameState] = useState<GameState>('playing');
    const [keyStatuses, setKeyStatuses] = useState<{ [key: string]: LetterStatus }>({});
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        // Prioritize learned words for the game
        const learnedFiveLetterWords = vocabulary.learnedWordsList.filter(w => w.word.length === WORD_LENGTH && /^[a-zA-Z]+$/.test(w.word));
        
        let wordPool;
        if (learnedFiveLetterWords.length > 0) {
            wordPool = learnedFiveLetterWords;
        } else {
            // Fallback to any 5-letter word if no learned ones fit
            wordPool = vocabulary.allWords.filter(w => w.word.length === WORD_LENGTH && /^[a-zA-Z]+$/.test(w.word));
        }

        if (wordPool.length > 0) {
            const randomWord = wordPool[Math.floor(Math.random() * wordPool.length)];
            setSecretWord(randomWord.word.toLowerCase());
        } else {
            setGameState('no-words');
        }
    }, [vocabulary.allWords, vocabulary.learnedWordsList]);

    const handleKeyPress = useCallback((key: string) => {
        if (gameState !== 'playing') return;

        if (key === 'Enter') {
            if (guesses[currentGuessIndex].length !== WORD_LENGTH) {
                setFeedbackMessage(`Guess must be ${WORD_LENGTH} letters`);
                setTimeout(() => setFeedbackMessage(null), 1500);
                return;
            }
            // Check win/loss
            const isCorrect = guesses[currentGuessIndex] === secretWord;
            if (isCorrect) {
                setGameState('won');
                vocabulary.recordQuizResult(secretWord!, 5);
            } else if (currentGuessIndex === MAX_GUESSES - 1) {
                setGameState('lost');
                vocabulary.recordQuizResult(secretWord!, 0);
            }
            // Update key statuses
            const newKeyStatuses = { ...keyStatuses };
            guesses[currentGuessIndex].split('').forEach((letter, i) => {
                if (secretWord![i] === letter) {
                    newKeyStatuses[letter] = 'correct';
                } else if (secretWord!.includes(letter) && newKeyStatuses[letter] !== 'correct') {
                    newKeyStatuses[letter] = 'present';
                } else {
                    newKeyStatuses[letter] = 'absent';
                }
            });
            setKeyStatuses(newKeyStatuses);
            
            setCurrentGuessIndex(prev => prev + 1);
        } else if (key === 'Backspace') {
            setGuesses(g => {
                const newGuesses = [...g];
                newGuesses[currentGuessIndex] = newGuesses[currentGuessIndex].slice(0, -1);
                return newGuesses;
            });
        } else if (/^[a-z]$/i.test(key) && guesses[currentGuessIndex].length < WORD_LENGTH) {
            setGuesses(g => {
                const newGuesses = [...g];
                newGuesses[currentGuessIndex] += key.toLowerCase();
                return newGuesses;
            });
        }
    }, [guesses, currentGuessIndex, gameState, secretWord, keyStatuses, vocabulary]);
    
    useEffect(() => {
        if ((gameState === 'won' || gameState === 'lost') && !isFinished) {
            addPracticeSession({
                type: 'Wordle',
                score: gameState === 'won' ? 1 : 0,
                total: 1
            });
            setIsFinished(true);
        }
    }, [gameState, addPracticeSession, isFinished]);


    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => handleKeyPress(e.key);
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyPress]);

    const getTileStatus = (letter: string, index: number, guess: string): LetterStatus => {
        if (!secretWord || guess.length <= index) return 'empty';
        if (secretWord[index] === letter) return 'correct';
        if (secretWord.includes(letter)) return 'present';
        return 'absent';
    };

    if (gameState === 'no-words') {
        return (
            <div className="text-center p-8 bg-base-100 rounded-lg shadow-md">
                <p className="text-neutral font-semibold">Wordle requires 5-letter words.</p>
                <p className="text-neutral-content">Please learn more words to play this game.</p>
                <button onClick={onFinish} className="mt-4 bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors">
                    Back to Practice
                </button>
            </div>
        );
    }
    
    if (!secretWord) {
        return <Loader message="Finding a secret word..." />
    }

    return (
        <div className="w-full flex flex-col items-center">
            <h2 className="text-2xl font-title font-bold text-secondary mb-4">Wordle</h2>
            
            <div className="grid grid-rows-6 gap-1.5 mb-4">
                {guesses.map((guess, i) => (
                    <div key={i} className="grid grid-cols-5 gap-1.5">
                        {Array.from({ length: WORD_LENGTH }).map((_, j) => {
                            const letter = guess[j] || '';
                            const isSubmitted = i < currentGuessIndex;
                            const status = isSubmitted ? getTileStatus(letter, j, guess) : 'empty';
                            const statusClasses = {
                                correct: 'bg-success text-white border-success',
                                present: 'bg-warning text-white border-warning',
                                absent: 'bg-neutral/40 text-white border-neutral/40',
                                empty: 'bg-base-100 border-base-300'
                            }[status];

                            return (
                                <div
                                    key={j}
                                    className={`w-12 h-12 sm:w-14 sm:h-14 border-2 rounded-md flex items-center justify-center font-bold text-2xl uppercase ${statusClasses}`}
                                >
                                    {guesses[i][j]}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
             
             <AnimatePresence>
             {(gameState === 'won' || gameState === 'lost') && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-base-100 p-6 rounded-lg shadow-xl text-center mb-4">
                    <h3 className={`text-2xl font-bold ${gameState === 'won' ? 'text-success' : 'text-error'}`}>
                        {gameState === 'won' ? 'You Won!' : 'Nice Try!'}
                    </h3>
                    <p className="mt-2 text-neutral-content">The word was: <span className="font-bold uppercase text-primary">{secretWord}</span></p>
                    <button onClick={onFinish} className="mt-4 w-full bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors">
                        Back to Menu
                    </button>
                </motion.div>
             )}
             </AnimatePresence>
            
            <div className="w-full max-w-sm">
                <AnimatePresence>
                {feedbackMessage && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center font-semibold text-error mb-2">{feedbackMessage}</motion.p>
                )}
                </AnimatePresence>
                <Keyboard onKeyPress={handleKeyPress} keyStatuses={keyStatuses} />
            </div>
        </div>
    );
};

export default WordleGame;