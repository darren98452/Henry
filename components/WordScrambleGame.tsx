import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Word, PracticeSession } from '../types';
import type { UseVocabularyReturn } from '../hooks/useVocabulary';
import Loader from './Loader';
import StarRating from './StarRating';

interface WordScrambleGameProps {
  vocabulary: UseVocabularyReturn;
  onFinish: () => void;
  addPracticeSession: (sessionData: Omit<PracticeSession, 'id' | 'date'>) => void;
}

const GAME_LENGTH = 5;

const scrambleWord = (word: string): string => {
  let scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
  // Ensure the scrambled word is not the same as the original
  if (scrambled === word && word.length > 1) {
    return scrambleWord(word);
  }
  return scrambled;
};


const WordScrambleGame: React.FC<WordScrambleGameProps> = ({ vocabulary, onFinish, addPracticeSession }) => {
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  const fetchWords = useCallback(() => {
    setIsLoading(true);
    let wordsForGame = [...vocabulary.learnedWordsList].sort(() => 0.5 - Math.random());
    
    if (wordsForGame.length < GAME_LENGTH) {
      const otherWords = vocabulary.allWords
          .filter(w => !wordsForGame.some(gw => gw.word === w.word))
          .sort(() => 0.5 - Math.random());
      wordsForGame.push(...otherWords.slice(0, GAME_LENGTH - wordsForGame.length));
    }

    wordsForGame = wordsForGame.slice(0, GAME_LENGTH);
    setWords(wordsForGame);
    setIsLoading(false);
  }, [vocabulary.learnedWordsList, vocabulary.allWords]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const currentWord = useMemo(() => words[currentIndex], [words, currentIndex]);
  const scrambledWord = useMemo(() => currentWord ? scrambleWord(currentWord.word) : '', [currentWord]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback || !currentWord) return;

    const isCorrect = userInput.trim().toLowerCase() === currentWord.word.toLowerCase();
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    vocabulary.recordQuizResult(currentWord.word, isCorrect ? 4 : 1);

    if (isCorrect) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    setFeedback(null);
    setUserInput('');
    setCurrentIndex(i => i + 1);
  };
  
  const isGameOver = currentIndex >= words.length;

  useEffect(() => {
    if (isGameOver && !isFinished && words.length > 0) {
        addPracticeSession({
            type: 'Word Scramble',
            score: score,
            total: words.length
        });
        setIsFinished(true);
    }
  }, [isGameOver, words.length, score, addPracticeSession, isFinished]);


  if (isLoading) {
    return <Loader message="Scrambling words..." />;
  }

  if (words.length === 0) {
    return (
        <div className="text-center p-8 bg-base-100 rounded-lg shadow-md">
            <p className="text-neutral-content">Not enough words to start the game.</p>
            <button onClick={onFinish} className="mt-4 bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors">
                Back to Practice
            </button>
        </div>
    );
  }

  if (isGameOver) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-8 bg-base-100 rounded-lg shadow-xl animate-fade-in">
        <h2 className="text-3xl font-title font-bold text-primary mb-4">Game Over!</h2>
        <p className="text-xl text-neutral mb-2">You scored</p>
        <p className="text-5xl font-extrabold text-secondary mb-6">{score} / {words.length}</p>
        <StarRating score={score} total={words.length} />
        <button onClick={onFinish} className="mt-8 w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-focus transition-colors text-lg">
          Finish
        </button>
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-title font-bold text-accent">Word Scramble</h2>
        <p className="font-semibold text-neutral-content">{currentIndex + 1} / {words.length}</p>
      </div>
      <div className="bg-base-100 p-6 rounded-lg shadow-md">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <p className="text-neutral-content mb-2">Unscramble the letters:</p>
            <p className="text-4xl font-bold tracking-widest text-primary mb-6 bg-primary/10 py-4 rounded-lg">{scrambledWord}</p>
            <p className="text-neutral-content font-medium">{currentWord.definition}</p>
          </motion.div>
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={!!feedback}
            className={`w-full p-4 text-center text-lg font-semibold bg-base-200 border-2 rounded-lg transition-colors focus:ring-2 focus:ring-primary focus:outline-none
              ${feedback === 'correct' ? 'border-success text-success' : ''}
              ${feedback === 'incorrect' ? 'border-error text-error' : 'border-base-300'}
            `}
            placeholder="Your answer"
          />
          {!feedback && (
            <button type="submit" className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-focus transition-colors">
              Submit
            </button>
          )}
        </form>

        <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center"
          >
            {feedback === 'incorrect' && (
              <p className="text-error font-semibold">Not quite. The correct answer was: <span className="font-bold">{currentWord.word}</span></p>
            )}
            {feedback === 'correct' && (
              <p className="text-success font-semibold">Correct! Well done!</p>
            )}
            <button onClick={handleNext} className="mt-4 w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-focus transition-colors">
              Next
            </button>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WordScrambleGame;
