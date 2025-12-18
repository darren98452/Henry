import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UseVocabularyReturn } from '../hooks/useVocabulary';
import type { PracticeSession } from '../types';
import Quiz from '../components/Quiz';
import SwipeGame from '../components/SwipeGame';
import WordScrambleGame from '../components/WordScrambleGame';
import SpellingBeeGame from '../components/SpellingBeeGame';
import WordleGame from '../components/WordleGame';
import { Brain, Gamepad2, ArrowLeft, Shuffle, Ear, Puzzle } from 'lucide-react';

interface PracticeViewProps {
  vocabulary: UseVocabularyReturn;
  addPracticeSession: (sessionData: Omit<PracticeSession, 'id' | 'date'>) => void;
}

type PracticeMode = 'menu' | 'quiz' | 'swipe' | 'scramble' | 'spelling' | 'wordle';

const PracticeCard: React.FC<{title: string, description: string, icon: React.ReactNode, onClick: () => void, color: 'primary' | 'secondary' | 'accent'}> = ({ title, description, icon, onClick, color }) => {
    const colorClasses = {
        primary: { border: 'border-primary', bg: 'bg-primary/10', text: 'text-primary' },
        secondary: { border: 'border-secondary', bg: 'bg-secondary/10', text: 'text-secondary' },
        accent: { border: 'border-accent', bg: 'bg-accent/10', text: 'text-accent' },
    }
    const currentColors = colorClasses[color];

    return (
        <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`w-full text-left p-6 bg-base-100 rounded-2xl shadow-md border-l-8 ${currentColors.border} flex items-center space-x-6 transition-all`}>
            <div className={`p-4 rounded-full ${currentColors.bg} ${currentColors.text}`}>
                {icon}
            </div>
            <div>
            <h3 className="text-xl font-title font-bold text-neutral">{title}</h3>
            <p className="text-neutral-content mt-1">{description}</p>
            </div>
        </motion.button>
    );
};

const PracticeView: React.FC<PracticeViewProps> = ({ vocabulary, addPracticeSession }) => {
  const [mode, setMode] = useState<PracticeMode>('menu');

  const renderContent = () => {
    switch (mode) {
      case 'quiz':
        return <Quiz vocabulary={vocabulary} onFinish={() => setMode('menu')} addPracticeSession={addPracticeSession} />;
      case 'swipe':
        return <SwipeGame vocabulary={vocabulary} onFinish={() => setMode('menu')} addPracticeSession={addPracticeSession} />;
      case 'scramble':
        return <WordScrambleGame vocabulary={vocabulary} onFinish={() => setMode('menu')} addPracticeSession={addPracticeSession} />;
      case 'spelling':
        return <SpellingBeeGame vocabulary={vocabulary} onFinish={() => setMode('menu')} addPracticeSession={addPracticeSession} />;
      case 'wordle':
        return <WordleGame vocabulary={vocabulary} onFinish={() => setMode('menu')} addPracticeSession={addPracticeSession} />;
      case 'menu':
      default:
        return (
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-title font-bold text-neutral mb-2">Practice Zone</h1>
                <p className="text-neutral-content">Choose an activity to test your knowledge.</p>
            </motion.div>
            
            <div className="space-y-4">
              <PracticeCard 
                title="Vocabulary Quiz"
                description="Test your knowledge with multiple-choice questions."
                icon={<Brain size={32} />}
                onClick={() => setMode('quiz')}
                color="primary"
              />
              <PracticeCard 
                title="Synonym Swipe"
                description="A fast-paced game to identify synonyms."
                icon={<Gamepad2 size={32} />}
                onClick={() => setMode('swipe')}
                color="secondary"
              />
               <PracticeCard 
                title="Word Scramble"
                description="Unscramble the letters to find the hidden word."
                icon={<Shuffle size={32} />}
                onClick={() => setMode('scramble')}
                color="accent"
              />
              <PracticeCard 
                title="Spelling Bee"
                description="Listen to the word and spell it correctly."
                icon={<Ear size={32} />}
                onClick={() => setMode('spelling')}
                color="primary"
              />
               <PracticeCard 
                title="Wordle"
                description="Guess the secret 5-letter word in 6 tries."
                icon={<Puzzle size={32} />}
                onClick={() => setMode('wordle')}
                color="secondary"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div>
        {mode !== 'menu' && (
            <button onClick={() => setMode('menu')} className="flex items-center space-x-2 text-primary font-semibold mb-4">
                <ArrowLeft size={20} />
                <span>Back to Practice Menu</span>
            </button>
        )}
        <AnimatePresence mode="wait">
            <motion.div
                key={mode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
            >
                {renderContent()}
            </motion.div>
        </AnimatePresence>
    </div>
  );
};

export default PracticeView;