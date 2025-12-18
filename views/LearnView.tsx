import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UseVocabularyReturn } from '../hooks/useVocabulary';
import Flashcard from '../components/Flashcard';
import { ArrowLeft, ArrowRight, BrainCircuit } from 'lucide-react';
import Mascot from '../components/Mascot';

interface LearnViewProps {
  vocabulary: UseVocabularyReturn;
}

const LearnView: React.FC<LearnViewProps> = ({ vocabulary }) => {
  const { wordsToLearn, bookmarkedWords, toggleBookmark, recordQuizResult, fetchNewWords } = vocabulary;
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < wordsToLearn.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const handleRate = (wordIdentifier: string, rating: 'hard' | 'good' | 'easy') => {
    let quality: number;
    switch (rating) {
        case 'hard': quality = 2; break;
        case 'good': quality = 4; break;
        case 'easy': quality = 5; break;
        default: quality = 4;
    }
    
    recordQuizResult(wordIdentifier, quality);
    
    if (wordsToLearn.length > 1 && currentIndex >= wordsToLearn.length - 1) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const handleFetchNewWords = async () => {
      await fetchNewWords();
      // After fetching, new words will be in wordsToLearn. 
      // We can reset index to start from the first new word.
      if(wordsToLearn.length === 0) {
         setCurrentIndex(0);
      }
  }

  const currentWord = wordsToLearn[currentIndex];

  if (wordsToLearn.length === 0) {
    return (
      <div className="text-center p-8 flex flex-col items-center justify-center h-[calc(100vh-112px)]">
        <Mascot message="You're a vocabulary superstar! Ready for another challenge?" />
        <h2 className="text-2xl font-bold text-success mt-4 mb-2">All Words Learned!</h2>
        <p className="text-neutral-content mb-6">You've gone through all the current words.</p>
        <button 
          onClick={handleFetchNewWords} 
          className="bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-focus transition-colors flex items-center space-x-2 shadow-lg"
        >
          <BrainCircuit size={20} />
          <span>Learn More Words</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-112px)]">
      <h1 className="flex-shrink-0 text-2xl font-title font-bold text-neutral mb-4 text-center">Learn New Words</h1>
      <div className="flex-grow flex flex-col items-center justify-center">
         <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
                <Flashcard 
                    word={currentWord} 
                    isBookmarked={bookmarkedWords.has(currentWord.word)}
                    onBookmark={toggleBookmark}
                    onRate={handleRate}
                />
            </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex-shrink-0 pt-4">
        <div className="flex justify-center items-center">
            <button onClick={handlePrev} disabled={currentIndex === 0} className="p-3 rounded-full bg-base-100 shadow-md disabled:opacity-50">
            <ArrowLeft className="text-primary" />
            </button>
            <p className="mx-6 font-semibold text-neutral-content">{currentIndex + 1} / {wordsToLearn.length}</p>
            <button onClick={handleNext} disabled={currentIndex === wordsToLearn.length - 1} className="p-3 rounded-full bg-base-100 shadow-md disabled:opacity-50">
            <ArrowRight className="text-primary" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default LearnView;
