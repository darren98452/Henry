
import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';

interface MascotProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

// --- Animation Variants ---

const clickWrapperVariants: Variants = {
  initial: { scale: 1, rotate: 0 },
  clicked: {
    scale: [1, 1.1, 0.95, 1],
    rotate: [0, -5, 5, -5, 0],
    transition: { duration: 0.6, ease: 'easeInOut' },
  },
};

const wingVariants = (isLeft: boolean): Variants => ({
  initial: { rotate: 0 },
  clicked: {
    rotate: [0, isLeft ? -25 : 25, 0],
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
});

const pupilVariants: Variants = {
  initial: { scale: 1 },
  clicked: {
    scale: 1.2,
    transition: { duration: 0.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
  },
};

const beakVariants: Variants = {
  initial: { y: 0, scaleY: 1 },
  clicked: {
    y: [0, -1, 0],
    scaleY: [1, 0.8, 1],
    transition: { duration: 0.3 },
  },
};


const Mascot: React.FC<MascotProps> = ({ message, size = 'md' }) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    if (isClicked) return;
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 600);
  };
  
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const animationState = isClicked ? 'clicked' : 'initial';

  return (
    <div
      onClick={handleClick}
      className="flex flex-col items-center"
      style={{ cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
      aria-label="Interactive owl mascot"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
    >
       {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-base-100 p-3 rounded-lg shadow-md max-w-xs text-center mb-2"
        >
          <p className="text-sm text-neutral-content">{message}</p>
          <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-base-100"></div>
        </motion.div>
      )}

      <motion.div
        variants={clickWrapperVariants}
        animate={animationState}
      >
        <motion.div
            animate={{ y: ["-4%", "4%"] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            className={sizeClasses[size]}
        >
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-label="Henry the owl mascot">
                <title>Henry the Owl</title>
                <g stroke="#5B21B6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    {/* Body */}
                    <path fill="#C4B5FD" d="M100,170 C55,170 45,110 45,80 C45,40 70,25 100,25 C130,25 155,40 155,80 C155,110 145,170 100,170 Z" />

                    {/* Face Plate */}
                    <path fill="#F5F3FF" d="M140,85 C140,115 120,135 100,135 C80,135 60,115 60,85 C60,55 80,40 100,40 C120,40 140,55 140,85 Z" />
                    <path fill="none" d="M100,40 C110,35 125,35 133,42" />
                    <path fill="none" d="M100,40 C90,35 75,35 67,42" />
                    
                    {/* Chest feathers */}
                    <g fill="none" strokeWidth="3" stroke="#A78BFA" strokeOpacity="0.7">
                        <path d="M70,120 C75,125 80,128 85,128" />
                        <path d="M80,128 C85,133 90,136 95,136" />
                        <path d="M90,136 C95,141 100,144 105,144" />
                        <path d="M100,144 C105,141 110,138 115,136" />
                        <path d="M110,136 C115,133 120,130 125,128" />
                        <path d="M120,128 C125,125 130,122 132,120" />
                        
                        <path d="M75,135 C80,140 85,143 90,143" />
                        <path d="M85,143 C90,148 95,151 100,151" />
                        <path d="M95,151 C100,148 105,145 110,143" />
                        <path d="M105,143 C110,140 115,137 118,135" />

                        <path d="M83,150 C88,155 93,158 98,158" />
                        <path d="M93,158 C98,163 103,161 108,158" />
                        <path d="M103,158 C108,155 113,152 116,150" />
                        
                        <path d="M93,165 C98,170 103,168 108,165" />
                    </g>
                    
                    {/* Ear Tufts */}
                    <g fill="#A78BFA">
                        <path d="M68,45 C60,30 65,20 75,22 C85,24 82,38 78,48" />
                        <path d="M132,45 C140,30 135,20 125,22 C115,24 118,38 122,48" />
                    </g>
                    
                    {/* Wings */}
                    <motion.g variants={wingVariants(true)} animate={animationState} style={{ transformOrigin: '65px 110px' }}>
                        <path fill="#A78BFA" d="M65,110 C35,115 30,145 50,160 C57,155 63,145 70,135 C77,125 75,115 65,110 Z" />
                         <path fill="none" d="M52,125 C57,128 62,132 65,138" />
                         <path fill="none" d="M49,135 C54,138 59,142 62,148" />
                         <path fill="none" d="M47,145 C52,148 57,152 60,158" />
                    </motion.g>
                    <motion.g variants={wingVariants(false)} animate={animationState} style={{ transformOrigin: '135px 110px' }}>
                        <path fill="#A78BFA" d="M135,110 C165,115 170,145 150,160 C143,155 137,145 130,135 C123,125 125,115 135,110 Z" />
                        <path fill="none" d="M148,125 C143,128 138,132 135,138" />
                        <path fill="none" d="M151,135 C146,138 141,142 138,148" />
                        <path fill="none" d="M153,145 C148,148 143,152 140,158" />
                    </motion.g>

                    {/* Eyes */}
                    <g>
                        <circle fill="#F5F3FF" cx="82" cy="85" r="22" />
                        <circle fill="#F5F3FF" cx="118" cy="85" r="22" />
                        <circle fill="white" strokeWidth="2" cx="82" cy="85" r="18" />
                        <circle fill="white" strokeWidth="2" cx="118" cy="85" r="18" />
                        <g fill="#2E1065" stroke="none">
                            <motion.circle variants={pupilVariants} animate={animationState} cx="82" cy="85" r="12" />
                            <motion.circle variants={pupilVariants} animate={animationState} cx="118" cy="85" r="12" />
                        </g>
                        <g fill="white" stroke="none">
                            <circle cx="88" cy="80" r="4" />
                            <circle cx="124" cy="80" r="4" />
                        </g>
                    </g>
                    
                    {/* Beak */}
                    <motion.path variants={beakVariants} animate={animationState} fill="#FCD34D" d="M100,98 L108,110 C105,113 95,113 92,110 Z" style={{transformOrigin: '100px 104px'}} />

                    {/* Feet */}
                    <g fill="#FCD34D">
                        <path d="M80,165 C75,165 75,175 80,175" />
                        <path d="M85,165 C80,165 80,178 85,178" />
                        <path d="M90,165 C85,165 85,175 90,175" />
                        <path d="M120,165 C125,165 125,175 120,175" />
                        <path d="M115,165 C120,165 120,178 115,178" />
                        <path d="M110,165 C115,165 115,175 110,175" />
                    </g>
                </g>
            </svg>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Mascot;
