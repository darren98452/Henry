import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { UseVocabularyReturn } from '../hooks/useVocabulary';
import { Gamepad2, BookText, Zap } from 'lucide-react';
import Mascot from '../components/Mascot';

interface HomeViewProps {
  vocabulary: UseVocabularyReturn;
  onNavigateToDictionary: () => void;
  onNavigateToPractice: () => void;
  userName: string;
}

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HomeView: React.FC<HomeViewProps> = ({ vocabulary, onNavigateToDictionary, onNavigateToPractice, userName }) => {
  const { wordsToLearn, wordsToReview, learnedWordsList } = vocabulary;

  // Build weekly activity from learned words
  const activityData = useMemo(() => {
    const today = new Date();
    const counts: { [date: string]: number } = {};

    // initialize last 7 days with 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      counts[key] = 0;
    }

    // count each word on the day it was first learned
    for (const word of learnedWordsList) {
      if (!word.srsData || !word.srsData.history?.length) continue;
      const firstTs = word.srsData.history[0].timestamp;
      const key = firstTs.slice(0, 10);
      if (counts[key] != null) {
        counts[key] += 1;
      }
    }

    return Object.keys(counts)
      .sort()
      .map(dateStr => {
        const d = new Date(dateStr);
        return {
          name: dayLabels[d.getDay()],
          words: counts[dateStr],
        };
      });
  }, [learnedWordsList]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[calc(100vh-112px)] space-y-4">
      <div className="animate-fade-in flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-title font-bold text-neutral">
            Hello, {userName}!
          </h1>
          <p className="text-neutral-content text-sm">Let's make today a productive day.</p>
        </div>
        <Mascot size="sm" />
      </div>

      <motion.div
        className="animate-pop-in flex-shrink-0"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
      >
        <h2 className="text-xl font-title font-bold text-neutral mb-2 flex items-center">
          <Zap size={24} className="mr-2 text-primary" />
          Learning Hub
        </h2>
        <div className="bg-gradient-to-br from-primary to-teal-400 text-white p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-4 left-0 w-32 h-32 bg-white/10 rounded-tr-full"></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold">Your Next Step</h3>
            {wordsToReview.length > 0 ? (
              <>
                <p className="mb-2 font-light text-sm">You have {wordsToReview.length} words to review today.</p>
                <p className="italic opacity-90 bg-white/20 p-2 rounded-lg text-xs">"Reviewing is key to retention!"</p>
              </>
            ) : (
              <>
                <p className="mb-2 font-light text-sm">You have {wordsToLearn.length} new words to learn.</p>
                <p className="italic opacity-90 bg-white/20 p-2 rounded-lg text-xs">"A new word is a new world."</p>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div className="animate-slide-in-up grid grid-cols-2 gap-3 flex-shrink-0" style={{ animationDelay: '0.2s' }}>
        <motion.button
          onClick={onNavigateToDictionary}
          whileTap={{ scale: 0.98 }}
          className="bg-base-100 p-3 rounded-xl shadow-sm flex items-center space-x-3 h-full text-left transition-transform transform hover:scale-105"
        >
          <div className="bg-secondary/10 p-3 rounded-full text-secondary">
            <BookText size={20} />
          </div>
          <div>
            <p className="text-lg font-title font-bold text-neutral">Dictionary</p>
            <p className="text-xs text-neutral-content">Look up any word</p>
          </div>
        </motion.button>
        <motion.button
          onClick={onNavigateToPractice}
          whileTap={{ scale: 0.98 }}
          className="bg-base-100 p-3 rounded-xl shadow-sm flex items-center space-x-3 h-full text-left transition-transform transform hover:scale-105"
        >
          <div className="bg-accent/10 p-3 rounded-full text-accent">
            <Gamepad2 size={20} />
          </div>
          <div>
            <p className="text-lg font-title font-bold text-neutral">Play Games</p>
            <p className="text-xs text-neutral-content">Test your skills</p>
          </div>
        </motion.button>
      </motion.div>

      <motion.div className="flex-grow flex flex-col animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
        <h2 className="text-lg font-title font-bold text-neutral mb-2 flex-shrink-0">Weekly Activity</h2>
        <div className="bg-base-100 p-2 rounded-2xl shadow-md flex-grow">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activityData} margin={{ top: 5, right: 15, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-base-300)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--color-neutral)', opacity: 0.7, fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--color-neutral)', opacity: 0.7, fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--color-base-100)', border: '1px solid var(--color-base-300)', borderRadius: '0.5rem' }} />
              <Line type="monotone" dataKey="words" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Words Learned" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HomeView;
