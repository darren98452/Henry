import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, BookOpen, Sparkles, Search, User, AlertTriangle } from 'lucide-react';
import HomeView from './views/HomeView';
import LearnView from './views/LearnView';
import PracticeView from './views/PracticeView';
import ProfileView from './views/ProfileView';
import ReverseDictionaryView from './views/ReverseDictionaryView';
import DictionaryView from './views/DictionaryView';
import BottomNav from './components/BottomNav';
import type { NavItem } from './types';
import { useVocabulary } from './hooks/useVocabulary';
import { useSettings } from './hooks/useSettings';
import { useSocial } from './hooks/useSocial';
import { usePracticeHistory } from './hooks/usePracticeHistory';
import { UserContext } from './contexts/UserContext';
import FullScreenLoader from './components/FullScreenLoader';
import AuthView from './views/AuthView';
import DisclaimerModal from './components/DisclaimerModal';

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'learn', label: 'Learn', icon: BookOpen },
  { id: 'practice', label: 'Practice', icon: Sparkles },
  { id: 'search', label: 'ReLex', icon: Search },
  { id: 'profile', label: 'Profile', icon: User },
];

const AppContent: React.FC = () => {
  const vocabulary = useVocabulary();
  const settingsHook = useSettings();
  const socialHook = useSocial();
  const practiceHistoryHook = usePracticeHistory();
  const [activeView, setActiveView] = useState('home');
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const { addCustomWord } = useContext(UserContext);

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <HomeView vocabulary={vocabulary} onNavigateToDictionary={() => setIsDictionaryOpen(true)} onNavigateToPractice={() => setActiveView('practice')} userName={settingsHook.settings.userName} />;
      case 'learn':
        return <LearnView vocabulary={vocabulary} />;
      case 'practice':
        return <PracticeView vocabulary={vocabulary} addPracticeSession={practiceHistoryHook.addPracticeSession} />;
      case 'search':
        return <ReverseDictionaryView />;
      case 'profile':
        return <ProfileView vocabulary={vocabulary} settingsHook={settingsHook} socialHook={socialHook} practiceHistoryHook={practiceHistoryHook} />;
      default:
        return <HomeView vocabulary={vocabulary} onNavigateToDictionary={() => setIsDictionaryOpen(true)} onNavigateToPractice={() => setActiveView('practice')} userName={settingsHook.settings.userName} />;
    }
  };

  return (
    <div className="min-h-screen bg-base-200 font-sans text-neutral">
      <div className="container mx-auto max-w-md pb-20"> {/* Add padding for bottom nav */}
        <main className="p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {isDictionaryOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setIsDictionaryOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-[95vh] bg-base-100 rounded-t-2xl z-50 flex flex-col"
            >
              <div className="flex-shrink-0 flex justify-center py-3 cursor-pointer" onClick={() => setIsDictionaryOpen(false)}>
                <div className="w-12 h-1.5 bg-base-300 rounded-full"></div>
              </div>
              <div className="flex-grow p-4 pt-0 overflow-y-auto">
                <DictionaryView onBack={() => setIsDictionaryOpen(false)} vocabulary={vocabulary} addCustomWord={addCustomWord} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <BottomNav items={navItems} activeItem={activeView} onItemClick={setActiveView} />
    </div>
  );
};

const App: React.FC = () => {
    const { authUser, isLoading, error, userData } = useContext(UserContext);

    if (isLoading) {
        const message = authUser ? "Loading your vocabulary..." : "Please wait...";
        return <FullScreenLoader message={message} />;
    }
    
    // Show a catastrophic error if data loading fails after login
    if (error && authUser) {
        return (
            <div className="fixed inset-0 bg-base-200 flex flex-col items-center justify-center text-center p-4">
                <AlertTriangle className="w-16 h-16 text-error mb-4" />
                <h1 className="text-2xl font-bold text-neutral mb-2">Oops! Something went wrong.</h1>
                <p className="text-neutral-content">{error}</p>
            </div>
        );
    }

    if (!authUser) {
        return <AuthView />;
    }
    
    // Ensure user data is loaded before showing the app
    if (!userData) {
        return <FullScreenLoader message="Loading your vocabulary..." />;
    }

    // Show disclaimer modal if user hasn't accepted it
    if (!userData.settings.hasAcceptedDisclaimer) {
        return <DisclaimerModal />;
    }
    
    return <AppContent />;
}

export default App;