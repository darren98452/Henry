import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';

export const usePracticeHistory = () => {
    const { userData, addPracticeSession, clearHistory } = useContext(UserContext);
    
    return { 
        history: userData?.practiceHistory || [], 
        addPracticeSession, 
        clearHistory 
    };
};

export type UsePracticeHistoryReturn = ReturnType<typeof usePracticeHistory>;
