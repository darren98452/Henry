import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UseVocabularyReturn } from '../hooks/useVocabulary';
import type { UseSettingsReturn } from '../hooks/useSettings';
import type { UseSocialReturn } from '../hooks/useSocial';
import type { UsePracticeHistoryReturn } from '../hooks/usePracticeHistory';
import SettingsView from './SettingsView';
import HistoryView from './HistoryView';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { Word, User as UserType } from '../types';
import { BookCopy, Target, User, Settings, Award, X, UserPlus, UserMinus, BookCheck, Brain, Gamepad2, Shuffle, Ear, Puzzle, Trophy, Medal, Crown } from 'lucide-react';
import Mascot from '../components/Mascot';
import { RANKS } from '../constants';
import api from '../services/apiService';
import Loader from '../components/Loader';

interface ProfileViewProps {
  vocabulary: UseVocabularyReturn;
  settingsHook: UseSettingsReturn;
  socialHook: UseSocialReturn;
  practiceHistoryHook: UsePracticeHistoryReturn;
}

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-base-100 p-4 rounded-xl shadow-sm flex items-center space-x-3 h-full">
        <div className="bg-primary/10 p-3 rounded-full text-primary">
            {icon}
        </div>
        <div>
            <p className="text-sm text-neutral-content">{label}</p>
            <p className="text-xl font-bold text-neutral">{value}</p>
        </div>
    </div>
);

const TabButton: React.FC<{ label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void; }> = ({ label, icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex flex-col sm:flex-row items-center justify-center space-x-0 sm:space-x-2 font-semibold py-2 rounded-full transition-colors duration-300 ${
        isActive ? 'bg-primary text-white shadow' : 'text-neutral-content hover:bg-base-200'
      }`}
    >
        {icon}
        <span className="text-xs sm:text-sm mt-1 sm:mt-0">{label}</span>
    </button>
  );
};

const LeaderboardRow: React.FC<{ 
    user: UserType; 
    rank: number; 
    isFriend: boolean; 
    isCurrentUser: boolean;
    onAddFriend: () => void;
    onRemoveFriend: () => void;
}> = ({ user, rank, isFriend, isCurrentUser, onAddFriend, onRemoveFriend }) => {
    
    let positionDisplay;
    let rowClass = "bg-base-100 border-base-200";

    if (rank === 1) {
        positionDisplay = <Crown size={20} className="text-yellow-500 fill-yellow-500" />;
        rowClass = "bg-yellow-50 border-yellow-200";
    } else if (rank === 2) {
        positionDisplay = <Medal size={20} className="text-gray-400 fill-gray-400" />;
        rowClass = "bg-gray-50 border-gray-200";
    } else if (rank === 3) {
        positionDisplay = <Medal size={20} className="text-orange-400 fill-orange-400" />;
        rowClass = "bg-orange-50 border-orange-200";
    } else {
        positionDisplay = <span className="font-bold text-neutral-content w-6 text-center">{rank}</span>;
    }

    if (isCurrentUser) {
        rowClass += " ring-2 ring-primary ring-offset-2";
    }

    // Determine user's level rank (Copper, Gold, etc.)
    const userLevelRank = [...RANKS].reverse().find(r => user.wordsLearned >= r.minWords) || RANKS[0];
    const LevelIcon = userLevelRank.icon;

    // Calculate progress to next level
    const currentRankIndex = RANKS.findIndex(r => r.name === userLevelRank.name);
    const nextRank = RANKS[currentRankIndex + 1];
    let progressPercent = 100;
    
    if (nextRank) {
        const wordsNeeded = nextRank.minWords - userLevelRank.minWords;
        const wordsProgress = user.wordsLearned - userLevelRank.minWords;
         if (wordsNeeded > 0) {
            progressPercent = Math.min(100, Math.max(0, (wordsProgress / wordsNeeded) * 100));
        }
    }

    return (
        <motion.li 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center p-3 rounded-xl border ${rowClass} mb-2 shadow-sm transition-colors`}
        >
            <div className="flex-shrink-0 w-8 flex justify-center items-center mr-2">
                {positionDisplay}
            </div>
            
            <div className="relative flex-shrink-0">
                <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full border-2 border-base-100 shadow-sm object-cover" />
                <div className="absolute -bottom-1 -right-1 bg-base-100 rounded-full p-0.5 shadow-md border border-base-200" title={userLevelRank.name}>
                    <LevelIcon className="w-4 h-4" />
                </div>
            </div>
            
            <div className="flex-grow min-w-0 ml-3 mr-2">
                <div className="flex items-center space-x-1.5">
                    <p className={`font-bold text-sm truncate ${isCurrentUser ? 'text-primary' : 'text-neutral'}`}>
                        {user.name}
                    </p>
                    {isCurrentUser && <span className="bg-primary text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">YOU</span>}
                </div>
                
                <div className="flex items-center justify-between text-xs text-neutral-content mt-0.5 mb-1">
                     <span>{userLevelRank.name}</span>
                     <span className="font-medium">{user.wordsLearned} words</span>
                </div>

                {nextRank ? (
                    <div className="w-full bg-base-300/50 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-secondary h-full rounded-full" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                ) : (
                    <div className="w-full bg-base-300/50 rounded-full h-1.5 overflow-hidden">
                         <div className="bg-gradient-to-r from-yellow-300 to-yellow-500 h-full w-full"></div>
                    </div>
                )}
            </div>

            <div className="flex-shrink-0">
                {!isCurrentUser && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); isFriend ? onRemoveFriend() : onAddFriend(); }}
                        className={`p-2 rounded-full transition-all duration-200 shadow-sm border ${isFriend 
                            ? 'text-error bg-base-100 border-base-200 hover:bg-error hover:text-white hover:border-error' 
                            : 'text-primary bg-primary/10 border-transparent hover:bg-primary hover:text-white'}`}
                        title={isFriend ? "Remove Friend" : "Add Friend"}
                    >
                        {isFriend ? <UserMinus size={16} /> : <UserPlus size={16} />}
                    </button>
                )}
            </div>
        </motion.li>
    );
};

const LeaguesModal: React.FC<{onClose: () => void}> = ({ onClose }) => {
    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-40"
                onClick={onClose}
            />
            <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-[60vh] bg-base-100 rounded-t-2xl z-50 flex flex-col p-6"
            >
                <div className="flex-shrink-0 flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-title font-bold text-neutral">All Leagues</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-base-200">
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto space-y-4">
                    {[...RANKS].reverse().map((rank) => {
                        const RankIcon = rank.icon;
                        return (
                            <div key={rank.name} className="flex items-center space-x-4 p-4 bg-base-200 rounded-xl">
                                <RankIcon className="w-12 h-12 flex-shrink-0" />
                                <div>
                                    <h3 className="text-xl font-bold text-primary">{rank.name}</h3>
                                    <p className="text-neutral-content">Reach {rank.minWords} words learned</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </>
    );
};


const ProfileContent: React.FC<{ vocabulary: UseVocabularyReturn, settingsHook: UseSettingsReturn, socialHook: UseSocialReturn, practiceHistoryHook: UsePracticeHistoryReturn }> = ({ vocabulary, settingsHook, socialHook, practiceHistoryHook }) => {
    const { progress, bookmarkedWordsList, learnedWordsList } = vocabulary;
    const { history: practiceHistory } = practiceHistoryHook;
    const { settings, authUser } = settingsHook;
    const { friends, isLoadingFriends, addFriend, removeFriend, isFriend } = socialHook;
    const [isLeaguesModalOpen, setIsLeaguesModalOpen] = useState(false);
    const [leaderboardView, setLeaderboardView] = useState<'league' | 'friends'>('league');
    const [leagueUsers, setLeagueUsers] = useState<UserType[]>([]);
    const [isLoadingLeague, setIsLoadingLeague] = useState(true);

    const RankIcon = progress.rank.icon;

    // --- Generate Progress Chart Data ---
    const progressData = useMemo(() => {
        const getWeekStartDate = (date: Date): Date => {
            const d = new Date(date);
            const day = d.getDay(); // Sunday - 0
            const diff = d.getDate() - day;
            const newDate = new Date(d.setDate(diff));
            newDate.setHours(0, 0, 0, 0);
            return newDate;
        };

        const stats: { [key: string]: { learned: number; totalCorrect: number; totalAnswered: number } } = {};

        // Process learned words to count new words per week
        learnedWordsList.forEach(word => {
            if (word.srsData && word.srsData.history.length > 0) {
                const learningDate = new Date(word.srsData.history[0].timestamp);
                const weekStartDate = getWeekStartDate(learningDate);
                const weekKey = weekStartDate.toISOString().split('T')[0];

                if (!stats[weekKey]) {
                    stats[weekKey] = { learned: 0, totalCorrect: 0, totalAnswered: 0 };
                }
                stats[weekKey].learned += 1;
            }
        });

        // Process practice history for weekly accuracy
        practiceHistory.forEach(session => {
            const sessionDate = new Date(session.date);
            const weekStartDate = getWeekStartDate(sessionDate);
            const weekKey = weekStartDate.toISOString().split('T')[0];

            if (!stats[weekKey]) {
                stats[weekKey] = { learned: 0, totalCorrect: 0, totalAnswered: 0 };
            }
            stats[weekKey].totalCorrect += session.score;
            stats[weekKey].totalAnswered += session.total;
        });

        const sortedWeeks = Object.keys(stats).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        if (sortedWeeks.length === 0) return [];
        
        // Fill in empty weeks between first and last data point for a continuous chart
        const filledStats: { [key: string]: { learned: number; totalCorrect: number; totalAnswered: number } } = {};
        const firstWeek = new Date(sortedWeeks[0]);
        const lastWeek = new Date(sortedWeeks[sortedWeeks.length - 1]);

        for (let d = new Date(firstWeek); d <= lastWeek; d.setDate(d.getDate() + 7)) {
            const weekKey = getWeekStartDate(d).toISOString().split('T')[0];
            filledStats[weekKey] = stats[weekKey] || { learned: 0, totalCorrect: 0, totalAnswered: 0 };
        }

        let cumulativeLearned = 0;
        return Object.entries(filledStats)
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .map(([date, data]) => {
                cumulativeLearned += data.learned;
                const accuracy = data.totalAnswered > 0 ? Math.round((data.totalCorrect / data.totalAnswered) * 100) : 0;
                const weekName = new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                return {
                    week: weekName,
                    learned: cumulativeLearned,
                    accuracy: accuracy,
                };
            });
    }, [learnedWordsList, practiceHistory]);
    
    // --- Game Performance Data ---
    const gameStats = useMemo(() => {
        const stats: Record<string, { played: number; totalScore: number; totalPossible: number }> = {};
        
        practiceHistory.forEach(session => {
            if (!stats[session.type]) {
                stats[session.type] = { played: 0, totalScore: 0, totalPossible: 0 };
            }
            stats[session.type].played += 1;
            stats[session.type].totalScore += session.score;
            stats[session.type].totalPossible += session.total;
        });

        return Object.entries(stats).map(([type, data]) => ({
            type,
            played: data.played,
            accuracy: data.totalPossible > 0 ? Math.round((data.totalScore / data.totalPossible) * 100) : 0
        })).sort((a, b) => b.played - a.played);
    }, [practiceHistory]);

    const gameTypeDetails: Record<string, { icon: any, color: string, bg: string }> = {
        'Quiz': { icon: Brain, color: 'text-primary', bg: 'bg-primary/10' },
        'Synonym Swipe': { icon: Gamepad2, color: 'text-secondary', bg: 'bg-secondary/10' },
        'Word Scramble': { icon: Shuffle, color: 'text-accent', bg: 'bg-accent/10' },
        'Spelling Bee': { icon: Ear, color: 'text-primary', bg: 'bg-primary/10' },
        'Wordle': { icon: Puzzle, color: 'text-secondary', bg: 'bg-secondary/10' }
    };

    // --- Leaderboard & League Logic ---
     useEffect(() => {
        const fetchLeagueUsers = async () => {
            if (!authUser) return;
            setIsLoadingLeague(true);
            try {
                const leagueIndex = RANKS.findIndex(r => r.name === progress.rank.name);
                const currentLeague = RANKS[leagueIndex];
                const nextLeague = leagueIndex < RANKS.length - 1 ? RANKS[leagueIndex + 1] : null;
                
                const users = await api.getLeagueUsers(currentLeague.minWords, nextLeague ? nextLeague.minWords : null);
                setLeagueUsers(users);
            } catch (e) {
                console.error("Failed to fetch league users", e);
                setLeagueUsers([]);
            } finally {
                setIsLoadingLeague(false);
            }
        };

        fetchLeagueUsers();
    }, [progress.rank.name, authUser]);

    const currentUser: UserType = useMemo(() => ({
        id: authUser?.uid || 'user0', 
        name: settings.userName,
        avatarUrl: `https://picsum.photos/seed/${authUser?.uid || 'user0'}/48/48`,
        wordsLearned: progress.wordsLearned,
        isCurrentUser: true,
    }), [authUser, settings.userName, progress.wordsLearned]);
    
    const { leagueUsersToShow, friendUsersToShow } = useMemo(() => {
        const combinedLeague = [...leagueUsers];
        if (!leagueUsers.some(u => u.id === currentUser.id)) {
            combinedLeague.push(currentUser);
        }
        combinedLeague.sort((a, b) => b.wordsLearned - a.wordsLearned);

        const combinedFriends = [...friends];
         if (!friends.some(u => u.id === currentUser.id)) {
            combinedFriends.push(currentUser);
        }
        combinedFriends.sort((a, b) => b.wordsLearned - a.wordsLearned);

        return { leagueUsersToShow: combinedLeague, friendUsersToShow: combinedFriends };
    }, [leagueUsers, friends, currentUser]);

    const usersToShow = leaderboardView === 'league' ? leagueUsersToShow : friendUsersToShow;
    const isLeaderboardLoading = leaderboardView === 'league' ? isLoadingLeague : isLoadingFriends;
    
    const currentLeague = progress.rank;
    const leagueIndex = RANKS.findIndex(r => r.name === currentLeague.name);
    const nextLeague = leagueIndex < RANKS.length - 1 ? RANKS[leagueIndex + 1] : null;

    let progressToNext = 0;
    if (nextLeague) {
        const wordsInCurrentLeague = progress.wordsLearned - currentLeague.minWords;
        const wordsForNextLeague = nextLeague.minWords - currentLeague.minWords;
        if (wordsForNextLeague > 0) {
          progressToNext = Math.max(0, Math.min(100, Math.round((wordsInCurrentLeague / wordsForNextLeague) * 100)));
        }
    } else {
        progressToNext = 100; // Maxed out
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center p-6 bg-base-100 rounded-2xl shadow-lg">
                <div className="relative">
                    <img src={currentUser.avatarUrl} alt="User Avatar" className="w-24 h-24 rounded-full border-4 border-primary shadow-md" />
                    <RankIcon className="absolute -bottom-2 -right-2 w-10 h-10" />
                </div>
                <h2 className="mt-4 text-3xl font-title font-bold text-neutral">{settings.userName}</h2>
                <p className="text-primary font-semibold">{progress.rank.name} Rank</p>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h3 className="text-xl font-title font-bold text-neutral mb-2">My Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                    <StatCard label="Words Learned" value={progress.wordsLearned} icon={<BookCopy size={24}/>} />
                    <StatCard label="Accuracy" value={`${progress.accuracy}%`} icon={<Target size={24} />} />
                    
                    <div className="col-span-2 bg-base-100 p-4 rounded-xl shadow-sm flex flex-col items-center text-center">
                        <h3 className="text-sm font-semibold text-neutral-content w-full text-left mb-2">Current League</h3>
                        <RankIcon className="w-20 h-20" />
                        <p className="text-2xl font-bold text-neutral mt-2">{progress.rank.name}</p>
                        
                        {nextLeague && (
                             <div className="w-full px-2 mt-3">
                                <div className="w-full bg-base-200 rounded-full h-2.5">
                                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progressToNext}%` }}></div>
                                </div>
                                <p className="text-xs text-neutral-content mt-1">
                                    {nextLeague.minWords - progress.wordsLearned} words to {nextLeague.name}
                                </p>
                            </div>
                        )}
                       
                        <button onClick={() => setIsLeaguesModalOpen(true)} className="mt-4 w-full bg-primary/10 text-primary font-bold py-2 px-4 rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center space-x-2">
                            <Award size={16} />
                            <span>View All Leagues</span>
                        </button>
                    </div>
                </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center justify-between mb-2">
                 <h3 className="text-xl font-title font-bold text-neutral">Leaderboard</h3>
                 <div className="text-xs font-semibold bg-base-200 px-2 py-1 rounded text-neutral-content">
                    {leaderboardView === 'league' ? 'Global' : 'Friends'}
                 </div>
              </div>
              
               <div className="flex bg-base-200 p-1 rounded-full mb-4">
                <button
                  onClick={() => setLeaderboardView('league')}
                  className={`w-1/2 py-2 text-sm font-bold rounded-full transition-all duration-300 ${leaderboardView === 'league' ? 'bg-white text-primary shadow-sm' : 'text-neutral-content hover:text-neutral'}`}
                >
                  <span className="flex items-center justify-center space-x-2">
                    <Trophy size={14} />
                    <span>My League</span>
                  </span>
                </button>
                <button
                  onClick={() => setLeaderboardView('friends')}
                  className={`w-1/2 py-2 text-sm font-bold rounded-full transition-all duration-300 ${leaderboardView === 'friends' ? 'bg-white text-primary shadow-sm' : 'text-neutral-content hover:text-neutral'}`}
                >
                  <span className="flex items-center justify-center space-x-2">
                    <User size={14} />
                    <span>Friends</span>
                  </span>
                </button>
              </div>

              <div className="min-h-[15rem]">
                   {isLeaderboardLoading ? (
                       <div className="flex justify-center items-center h-40 bg-base-100 rounded-2xl shadow-md">
                           <Loader message="Loading..." />
                       </div>
                   ) : (
                    <ul className="max-h-80 overflow-y-auto pr-1">
                      {usersToShow.map((user, index) => (
                          <LeaderboardRow 
                            key={user.id} 
                            user={user} 
                            rank={index + 1}
                            isFriend={isFriend(user.id)}
                            isCurrentUser={!!user.isCurrentUser}
                            onAddFriend={() => addFriend(user.id)}
                            onRemoveFriend={() => removeFriend(user.id)}
                          />
                      ))}
                      
                      {usersToShow.length <= 1 && leaderboardView === 'friends' && (
                          <div className="text-center p-8 bg-base-100 rounded-2xl border-2 border-dashed border-base-300">
                             <Mascot size="sm" />
                             <h4 className="font-bold text-neutral mt-3">Play with Friends!</h4>
                             <p className="text-sm text-neutral-content mb-4">Learning is more fun together. Switch to "My League" to find people to add.</p>
                             <button onClick={() => setLeaderboardView('league')} className="text-primary font-bold text-sm hover:underline">
                                Find people in my league
                             </button>
                          </div>
                      )}
                      
                      {usersToShow.length === 0 && leaderboardView === 'league' && (
                          <div className="text-center p-8 bg-base-100 rounded-2xl">
                             <p className="text-neutral-content">No one is in this league yet. You're the pioneer!</p>
                          </div>
                      )}
                   </ul>
                   )}
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h3 className="text-xl font-title font-bold text-neutral mb-2">Game Performance</h3>
                {gameStats.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {gameStats.map(stat => {
                            const details = gameTypeDetails[stat.type] || { icon: Target, color: 'text-neutral', bg: 'bg-base-200' };
                            const Icon = details.icon;
                            return (
                                <div key={stat.type} className="bg-base-100 p-4 rounded-xl shadow-sm flex items-center space-x-3">
                                    <div className={`p-3 rounded-full ${details.bg} ${details.color}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-bold text-neutral text-sm">{stat.type}</p>
                                        <div className="flex justify-between items-baseline mt-1">
                                            <p className="text-xs text-neutral-content">{stat.played} played</p>
                                            <p className={`font-bold ${details.color}`}>{stat.accuracy}% Acc</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center p-6 bg-base-100 rounded-xl shadow-sm text-neutral-content">
                        <p className="text-sm">Play games in the Practice Zone to see your performance breakdown here!</p>
                    </div>
                )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h3 className="text-xl font-title font-bold text-neutral mb-2">Progress Over Time</h3>
              <div className="bg-base-100 p-4 rounded-2xl shadow-md h-64">
                {progressData.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={progressData} margin={{ top: 5, right: 20, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-base-300)" />
                            <XAxis dataKey="week" tick={{ fill: 'var(--color-neutral)', opacity: 0.7 }} />
                            <YAxis yAxisId="left" stroke="var(--color-primary)" tick={{ fill: 'var(--color-primary)' }} />
                            <YAxis yAxisId="right" orientation="right" stroke="var(--color-secondary)" tick={{ fill: 'var(--color-secondary)' }} unit="%" />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--color-base-100)', border: '1px solid var(--color-base-300)', borderRadius: '0.5rem' }} />
                            <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '20px'}}/>
                            <Line yAxisId="left" type="monotone" dataKey="learned" name="Words Learned (Cumulative)" stroke="var(--color-primary)" strokeWidth={3} />
                            <Line yAxisId="right" type="monotone" dataKey="accuracy" name="Weekly Accuracy" stroke="var(--color-secondary)" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-neutral-content">
                        <Mascot message="Your progress chart will appear here as you learn more words over time!" />
                        <p className="mt-2 font-semibold">Not enough data to show progress yet.</p>
                    </div>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <h3 className="text-xl font-title font-bold text-neutral mb-2">Bookmarked Words</h3>
                <div className="bg-base-100 p-4 rounded-2xl shadow-md min-h-[18rem] flex flex-col justify-center">
                    {bookmarkedWordsList.length > 0 ? (
                         <ul className="divide-y divide-base-200 max-h-60 overflow-y-auto">
                            {bookmarkedWordsList.map((word: Word) => (
                                <li key={word.word} className="py-3">
                                    <p className="font-bold text-primary">{word.word}</p>
                                    <p className="text-sm text-neutral-content">{word.definition}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-4">
                           <Mascot message="Bookmark words you find tricky or interesting to review them here!" />
                        </div>
                    )}
                </div>
            </motion.div>
            <AnimatePresence>
                {isLeaguesModalOpen && <LeaguesModal onClose={() => setIsLeaguesModalOpen(false)} />}
            </AnimatePresence>
        </div>
    )
}

const ProfileView: React.FC<ProfileViewProps> = ({ vocabulary, settingsHook, socialHook, practiceHistoryHook }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'settings'>('profile');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-title font-bold text-neutral">Profile</h1>
            </div>
            
            <div className="flex bg-base-100 p-1 rounded-full shadow-inner space-x-1">
                <TabButton
                    label="Overview"
                    icon={<User size={18}/>}
                    isActive={activeTab === 'profile'}
                    onClick={() => setActiveTab('profile')}
                />
                 <TabButton
                    label="History"
                    icon={<BookCheck size={18}/>}
                    isActive={activeTab === 'history'}
                    onClick={() => setActiveTab('history')}
                />
                <TabButton
                    label="Settings"
                    icon={<Settings size={18}/>}
                    isActive={activeTab === 'settings'}
                    onClick={() => setActiveTab('settings')}
                />
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'profile' ? (
                        <ProfileContent vocabulary={vocabulary} settingsHook={settingsHook} socialHook={socialHook} practiceHistoryHook={practiceHistoryHook} />
                    ) : activeTab === 'history' ? (
                        <HistoryView practiceHistoryHook={practiceHistoryHook} />
                    ) : (
                        <SettingsView settingsHook={settingsHook} />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default ProfileView;