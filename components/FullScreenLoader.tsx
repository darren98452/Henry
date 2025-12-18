import React from 'react';
import Mascot from './Mascot';

const FullScreenLoader: React.FC<{ message?: string }> = ({ message = "Loading your vocabulary..." }) => {
  return (
    <div className="fixed inset-0 bg-base-200 flex flex-col items-center justify-center space-y-4 z-50">
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-4">
          <Mascot size="lg" />
        </div>
      </div>
      {message && <p className="text-neutral-content text-lg animate-pulse">{message}</p>}
    </div>
  );
};

export default FullScreenLoader;
