import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import type { Word, PracticeSession } from '../types';
import type { UseVocabularyReturn } from '../hooks/useVocabulary';
import Loader from './Loader';
import StarRating from './StarRating';

interface SpellingBeeGameProps {
  vocabulary: UseVocabularyReturn;
  onFinish: () => void;
  addPracticeSession: (sessionData: Omit<PracticeSession, 'id' | 'date'>) => void;
}

const GAME_LENGTH = 5;

const SpellingBeeGame: React.FC<SpellingBeeGameProps> = ({ vocabulary, onFinish, addPracticeSession }) => {
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
  
  const handleSpeak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }, []);

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
            type: 'Spelling Bee',
            score: score,
            total: words.length
        });
        setIsFinished(true);
    }
  }, [isGameOver, words.length, score, addPracticeSession, isFinished]);

  useEffect(() => {
      // Speak the first word when the game loads, and subsequent words on next
      if (currentWord) {
          handleSpeak(currentWord.word);
      }
  }, [currentWord, handleSpeak]);

  if (isLoading) {
    return <Loader message="Warming up the microphone..." />;
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
        <h2 className="text-2xl font-title font-bold text-primary">Spelling Bee</h2>
        <p className="font-semibold text-neutral-content">{currentIndex + 1} / {words.length}</p>
      </div>
      <div className="bg-base-100 p-6 rounded-lg shadow-md text-center">
        <p className="text-neutral-content mb-4">Listen to the word and type it below.</p>
        <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSpeak(currentWord.word)} 
            className="bg-secondary text-white rounded-full p-6 shadow-lg mb-6"
            aria-label="Listen to word"
        >
            <Volume2 size={48} />
        </motion.button>
        
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
            placeholder="Spell the word"
            aria-label="Enter your spelling"
          />
          {!feedback && (
            <button type="submit" className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-focus transition-colors">
              Check Spelling
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
              <p className="text-error font-semibold">Incorrect. The correct spelling is: <span className="font-bold">{currentWord.word}</span></p>
            )}
            {feedback === 'correct' && (
              <p className="text-success font-semibold">That's correct! Nicely done!</p>
            )}
            <button onClick={handleNext} className="mt-4 w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-focus transition-colors">
              Next Word
            </button>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SpellingBeeGame;
