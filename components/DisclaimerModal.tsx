import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { UserContext } from '../contexts/UserContext';
import Mascot from './Mascot';

const DisclaimerModal: React.FC = () => {
  const { acceptDisclaimer } = useContext(UserContext);

  return (
    <div className="fixed inset-0 bg-base-200/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="w-full max-w-md bg-base-100 rounded-2xl shadow-2xl p-6 text-center"
      >
        <div className="flex justify-center">
            <Mascot />
        </div>
        
        <h2 className="text-2xl font-title font-bold text-neutral mt-4">A Note on Content</h2>
        
        <p className="text-neutral-content my-4 text-sm">
          Vocab AI is an unabridged learning tool. Our word bank is comprehensive and includes the full spectrum of the English language. 
          This may include words that are considered mature, profane, or otherwise offensive.
        </p>
        <p className="text-neutral-content text-sm">
          This content is provided for educational purposes only. By continuing, you acknowledge that you are using this tool for learning.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={acceptDisclaimer}
          className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg mt-6 hover:bg-primary-focus transition-colors"
        >
          I Understand and Agree
        </motion.button>
      </motion.div>
    </div>
  );
};

export default DisclaimerModal;
