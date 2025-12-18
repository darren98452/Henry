import React, { useState, useEffect } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { Volume2, Info, X } from 'lucide-react';
import type { Word } from '../types';
import Mascot from './Mascot';

interface FlashcardProps {
  word: Word;
  isBookmarked: boolean;
  onBookmark: (word: string) => void;
  onRate: (wordIdentifier: string, rating: 'hard' | 'good' | 'easy') => void;
}

const mascotVariants: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  swipeRight: {
    x: ['110%', '40%', '-110%'],
    y: ['50%', '50%', '50%'],
    rotate: [-30, 10, 40],
    opacity: [0, 1, 0],
    scale: [0.5, 1, 0.5],
    transition: { duration: 0.8, ease: 'easeInOut', times: [0, 0.4, 1] }
  },
  swipeLeft: {
    x: ['-110%', '60%', '110%'],
    y: ['50%', '50%', '50%'],
    rotate: [40, -10, -30],
    opacity: [0, 1, 0],
    scale: [0.5, 1, 0.5],
    transition: { duration: 0.8, ease: 'easeInOut', times: [0, 0.4, 1] }
  },
}

const feedbackVariants: Variants = {
  initial: {
    x: 0,
    scale: 1,
  },
  shake: {
    x: [0, -8, 8, -8, 8, 0],
    transition: { duration: 0.4, ease: 'easeInOut' }
  },
  pop: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.3, ease: 'easeOut' }
  }
};

const sparkleVariants: Variants = {
    initial: {
        opacity: 0,
        scale: 0,
        rotate: 0,
    },
    animate: (i: number) => ({
        opacity: [0, 1, 0],
        scale: [0, 1.2, 0],
        rotate: Math.random() * 180 - 90,
        transition: {
            delay: i * 0.05,
            duration: 0.6,
            ease: 'easeOut',
        }
    })
};

const Sparkle: React.FC<{i: number}> = ({i}) => (
    <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-sparkle absolute text-amber-300 w-8 h-8"
        style={{
            top: `${10 + Math.random() * 80}%`,
            left: `${10 + Math.random() * 80}%`,
        }}
        variants={sparkleVariants}
        initial="initial"
        animate="animate"
        custom={i}
    >
        <path d="M9.93 2.55a2 2 0 0 0-3.36 2.9l-4.01 5.95a2 2 0 0 0 2.9 3.36l5.95-4.01a2 2 0 0 0 2.9-3.36z" />
        <path d="m22 2-1.29 2.57a1 1 0 0 1-1.42.34l-2.58-1.29a1 1 0 0 1-.34-1.42z" />
        <path d="m14 10-1.29 2.57a1 1 0 0 1-1.42.34l-2.58-1.29a1 1 0 0 1-.34-1.42z" />
    </motion.svg>
);

const DifficultyBadge: React.FC<{ difficulty: 'easy' | 'medium' | 'hard' }> = ({ difficulty }) => {
    const colors = {
        easy: 'bg-green-100 text-green-800 border-green-200',
        medium: 'bg-amber-100 text-amber-800 border-amber-200',
        hard: 'bg-rose-100 text-rose-800 border-rose-200',
    };

    return (
        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${colors[difficulty] || colors.medium}`}>
            {difficulty}
        </span>
    );
};


const Flashcard: React.FC<FlashcardProps> = ({ word, isBookmarked, onBookmark, onRate }) => {
  const [rotation, setRotation] = useState(0); // Use rotation state instead of isFlipped
  const [isAnimating, setIsAnimating] = useState(false);
  const [mascotAnimation, setMascotAnimation] = useState<'hidden' | 'swipeRight' | 'swipeLeft'>('hidden');
  const [feedback, setFeedback] = useState<'shake' | 'pop' | 'sparkles' | null>(null);
  const [showIpaInfo, setShowIpaInfo] = useState(false);

  // When a new card appears, ensure it's facing front.
  useEffect(() => {
    // Animate back to the closest "front-facing" rotation (0, 360, -360, etc.)
    setRotation(Math.round(rotation / 360) * 360);
    setFeedback(null); // Reset feedback animation on new word
    setShowIpaInfo(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word]);

  const handleFlip = () => {
    if (isAnimating || feedback || showIpaInfo) return;

    setIsAnimating(true);
    
    // Randomly decide which way the mascot will come from
    const flipDirection = Math.random() < 0.5 ? 1 : -1; // 1 for right->left, -1 for left->right
    
    setMascotAnimation(flipDirection === 1 ? 'swipeRight' : 'swipeLeft');
    
    // The delay should be slightly less than the mascot's animation start time
    setTimeout(() => {
        // Update rotation to flip the card
        setRotation(prev => prev + (180 * flipDirection));
    }, 150);

    // The animation timeout should match the total mascot animation duration
    setTimeout(() => {
        setIsAnimating(false);
        setMascotAnimation('hidden');
    }, 800);
  };
  
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Sorry, your browser doesn't support text-to-speech.");
    }
  };
  
  const handleRateClick = (rating: 'hard' | 'good' | 'easy') => {
    // Prevent multiple clicks while an animation is running
    if (isAnimating || feedback) return;
    
    if (rating === 'hard') {
      setFeedback('shake');
    } else if (rating === 'good') {
      setFeedback('pop');
    } else {
      setFeedback('sparkles');
    }
    
    // After animation, call onRate.
    // The component will either receive a new word (which resets animation state via useEffect) or unmount.
    setTimeout(() => {
        onRate(word.word, rating);
    }, 600); // Match animation duration
  };

  return (
    <motion.div
        variants={feedbackVariants}
        animate={feedback === 'shake' ? 'shake' : feedback === 'pop' ? 'pop' : 'initial'}
        className="relative"
    >
        <div className="w-full h-80 [perspective:1000px] relative cursor-pointer" onClick={handleFlip}>
            <motion.div
                className="absolute z-20 w-24 h-24"
                style={{ top: '50%', left: '50%', x: '-50%', y: '-50%' }}
                variants={mascotVariants}
                animate={mascotAnimation}
            >
                <Mascot size="sm" />
            </motion.div>
            
            <motion.div
                className="relative w-full h-full [transform-style:preserve-3d]"
                initial={false}
                animate={{ rotateY: rotation }} // Animate based on the rotation state
                transition={{ duration: 0.6, ease: 'easeInOut' }}
            >
                {/* Front of the card */}
                <div className="absolute w-full h-full [backface-visibility:hidden] bg-base-100 rounded-2xl shadow-lg flex flex-col justify-center items-center p-6 text-center">
                    <div className="absolute top-4 left-4">
                        <DifficultyBadge difficulty={word.difficulty} />
                    </div>
                    <h2 className="text-4xl font-bold text-primary">{word.word}</h2>
                    <div className="flex items-center space-x-2 mt-2 relative">
                        <p className="text-neutral-content">{word.pronunciation}</p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSpeak(word.word);
                            }}
                            className="text-neutral-content hover:text-primary transition-colors p-2"
                            aria-label="Listen to pronunciation"
                        >
                            <Volume2 size={28} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowIpaInfo(!showIpaInfo);
                            }}
                            className="text-neutral-content hover:text-info transition-colors p-1"
                            aria-label="IPA Info"
                        >
                            <Info size={12} />
                        </button>
                        <AnimatePresence>
                        {showIpaInfo && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-10 left-1/2 -translate-x-1/2 w-64 bg-base-100 text-left p-4 rounded-xl shadow-xl border border-base-200 z-50 text-sm cursor-default"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-primary text-xs uppercase">IPA Pronunciation</h4>
                                    <button onClick={(e) => { e.stopPropagation(); setShowIpaInfo(false); }} className="text-neutral-content hover:text-neutral">
                                        <X size={14} />
                                    </button>
                                </div>
                                <p className="text-neutral leading-relaxed text-xs">
                                    The <strong>International Phonetic Alphabet (IPA)</strong> uses symbols to represent exact sounds. It helps you pronounce words correctly, regardless of their spelling.
                                </p>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>
                    <p className="mt-8 text-sm text-neutral-content opacity-75">Tap to see meaning</p>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onBookmark(word.word);
                        }}
                        className="absolute top-4 right-4 text-neutral-content hover:text-amber-500"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isBookmarked ? "#f59e0b" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bookmark"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                    </button>
                </div>

                {/* Back of the card */}
                <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-primary text-white rounded-2xl shadow-lg flex flex-col p-6">
                    <div className="flex-grow overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                              <h3 className="text-xl font-bold border-b border-white/50 pb-2">
                                <span className="underline">{word.word}</span>{' '}– {word.definition}
                              </h3>

                              <p className="italic mt-4 text-sm">
                                "
                                {word.example.split(new RegExp(`(${word.word})`, 'i')).map((part, i) =>
                                    part.toLowerCase() === word.word.toLowerCase() ? (
                                    <span key={i} className="underline">
                                        {part}
                                    </span>
                                    ) : (
                                    <span key={i}>{part}</span>
                                    )
                                )}
                                "
                              </p>

                        <div className="mt-4">
                            <p className="font-semibold">Synonyms:</p>
                            <p className="text-sm">{word.synonyms.join(', ')}</p>
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onBookmark(word.word);
                        }}
                        className="absolute top-4 right-4 text-white/80 hover:text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isBookmarked ? "white" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bookmark"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                    </button>
                    <div className="flex-shrink-0 flex justify-around items-center pt-4 border-t border-white/30 mt-4">
                        <button onClick={(e) => { e.stopPropagation(); handleRateClick('hard'); }} className="px-6 py-3 font-semibold rounded-lg bg-white/20 hover:bg-white/30 transition-colors">Hard</button>
                        <button onClick={(e) => { e.stopPropagation(); handleRateClick('good'); }} className="px-6 py-3 font-semibold rounded-lg bg-white/20 hover:bg-white/30 transition-colors">Good</button>
                        <button onClick={(e) => { e.stopPropagation(); handleRateClick('easy'); }} className="px-6 py-3 font-semibold rounded-lg bg-white/20 hover:bg-white/30 transition-colors">Easy</button>
                    </div>
                </div>
            </motion.div>
        </div>
        
        {/* Sparkles container for 'Easy' feedback */}
        <AnimatePresence>
        {feedback === 'sparkles' && (
          <div className="absolute inset-0 pointer-events-none z-30">
            {[...Array(10)].map((_, i) => <Sparkle key={i} i={i} />)}
          </div>
        )}
        </AnimatePresence>
    </motion.div>
  );
};

export default Flashcard;