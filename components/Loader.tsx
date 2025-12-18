
import React from 'react';

const Loader: React.FC<{ message?: string }> = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      {message && <p className="text-slate-600 text-lg animate-pulse">{message}</p>}
    </div>
  );
};

export default Loader;