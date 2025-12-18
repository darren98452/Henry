import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Gamepad2, Shuffle, Ear, Puzzle, Trash2, Trophy, Target, History as HistoryIcon, Filter } from 'lucide-react';
import type { UsePracticeHistoryReturn } from '../hooks/usePracticeHistory';
import type { PracticeSession } from '../types';
import Mascot from '../components/Mascot';

interface HistoryViewProps {
  practiceHistoryHook: UsePracticeHistoryReturn;
}

const gameTypeDetails = {
    'Quiz': { icon: Brain, color: 'text-primary', bg: 'bg-primary/10' },
    'Synonym Swipe': { icon: Gamepad2, color: 'text-secondary', bg: 'bg-secondary/10' },
    'Word Scramble': { icon: Shuffle, color: 'text-accent', bg: 'bg-accent/10' },
    'Spelling Bee': { icon: Ear, color: 'text-primary', bg: 'bg-primary/10' },
    'Wordle': { icon: Puzzle, color: 'text-secondary', bg: 'bg-secondary/10' }
};

const HistoryItem: React.FC<{ session: PracticeSession }> = ({ session }) => {
    const details = gameTypeDetails[session.type];
    const Icon = details.icon;

    const formattedDate = new Date(session.date).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
    });

    const percentage = Math.round((session.score / session.total) * 100);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex items-center space-x-4 bg-base-100 p-4 rounded-xl shadow-sm"
        >
            <div className={`p-3 rounded-full ${details.bg} ${details.color}`}>
                <Icon size={24} />
            </div>
            <div className="flex-grow">
                <p className="font-bold text-neutral">{session.type}</p>
                <p className="text-xs text-neutral-content">{formattedDate}</p>
            </div>
            <div className="text-right">
                <p className={`font-extrabold text-xl ${details.color}`}>
                    {session.total > 1 ? `${percentage}%` : (session.score === 1 ? 'Win' : 'Loss')}
                </p>
                <p className="text-xs text-neutral-content">
                    {session.score}/{session.total}
                </p>
            </div>
        </motion.div>
    );
};

const StatsCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-base-100 p-3 rounded-xl shadow-sm flex flex-col items-center justify-center text-center space-y-1">
        <div className={`p-2 rounded-full bg-base-200 ${color}`}>
            {icon}
        </div>
        <p className="text-xs text-neutral-content font-medium">{title}</p>
        <p className="text-lg font-bold text-neutral">{value}</p>
    </div>
);

const HistoryView: React.FC<HistoryViewProps> = ({ practiceHistoryHook }) => {
    const { history, clearHistory } = practiceHistoryHook;
    const [showConfirm, setShowConfirm] = useState(false);
    const [filter, setFilter] = useState<string>('All');

    const categories = ['All', 'Quiz', 'Synonym Swipe', 'Word Scramble', 'Spelling Bee', 'Wordle'];

    const handleClear = () => {
        clearHistory();
        setShowConfirm(false);
    };

    const filteredHistory = useMemo(() => {
        if (filter === 'All') return history;
        return history.filter(session => session.type === filter);
    }, [history, filter]);

    const stats = useMemo(() => {
        if (filteredHistory.length === 0) return null;

        const totalGames = filteredHistory.length;
        let totalScorePercentage = 0;
        let bestSession = filteredHistory[0];

        filteredHistory.forEach(session => {
            const pct = session.total > 0 ? session.score / session.total : 0;
            totalScorePercentage += pct;
            
            const bestPct = bestSession.total > 0 ? bestSession.score / bestSession.total : 0;
            if (pct > bestPct) {
                bestSession = session;
            }
        });

        const avgAccuracy = Math.round((totalScorePercentage / totalGames) * 100);
        
        const bestScoreLabel = bestSession.total > 1 
            ? `${Math.round((bestSession.score / bestSession.total) * 100)}%`
            : (bestSession.score === 1 ? 'Win' : 'Loss');

        return {
            totalGames,
            avgAccuracy,
            bestScore: bestScoreLabel
        };
    }, [filteredHistory]);

    if (history.length === 0) {
        return (
            <div className="text-center p-8 flex flex-col items-center justify-center min-h-[50vh]">
                <Mascot message="Your practice history will appear here once you complete a quiz or a game." />
                <h3 className="text-xl font-bold text-neutral mt-4 mb-2">No History Yet</h3>
                <p className="text-neutral-content">Head over to the Practice Zone to test your skills!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-title font-bold text-neutral">Practice History</h3>
                <button
                    onClick={() => setShowConfirm(true)}
                    className="flex items-center space-x-2 text-xs font-semibold text-error hover:bg-error/10 px-3 py-2 rounded-lg transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Filter Chips */}
            <div className="flex overflow-x-auto pb-2 space-x-2 no-scrollbar -mx-4 px-4">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                            filter === cat 
                            ? 'bg-primary text-white shadow-md' 
                            : 'bg-base-200 text-neutral-content hover:bg-base-300'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Stats Summary Card */}
            <AnimatePresence mode="wait">
                {stats && (
                    <motion.div 
                        key={filter}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-3 gap-3"
                    >
                        <StatsCard 
                            title="Played" 
                            value={stats.totalGames.toString()} 
                            icon={<HistoryIcon size={18}/>} 
                            color="text-primary"
                        />
                        <StatsCard 
                            title="Avg. Accuracy" 
                            value={`${stats.avgAccuracy}%`} 
                            icon={<Target size={18}/>} 
                            color="text-secondary"
                        />
                         <StatsCard 
                            title="Best Run" 
                            value={stats.bestScore} 
                            icon={<Trophy size={18}/>} 
                            color="text-accent"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List */}
            <div className="space-y-3 min-h-[200px]">
                <AnimatePresence mode="popLayout">
                    {filteredHistory.length > 0 ? (
                        filteredHistory.map(session => <HistoryItem key={session.id} session={session} />)
                    ) : (
                         <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            className="text-center py-8 text-neutral-content"
                        >
                            <Filter size={48} className="mx-auto mb-2 opacity-20" />
                            <p>No {filter} games played yet.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showConfirm && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 z-40"
                            onClick={() => setShowConfirm(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="fixed inset-0 z-50 flex items-center justify-center"
                        >
                            <div className="bg-base-100 rounded-2xl p-6 shadow-xl w-full max-w-sm">
                                <h3 className="text-lg font-bold text-neutral">Are you sure?</h3>
                                <p className="text-neutral-content mt-2 mb-6">
                                    This will permanently delete your practice history. This action cannot be undone.
                                </p>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => setShowConfirm(false)}
                                        className="px-4 py-2 font-semibold bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleClear}
                                        className="px-4 py-2 font-semibold bg-error text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HistoryView;
