
import React from 'react';
import { HeartIcon } from './icons';

interface HeartsProps {
  count: number;
}

const Hearts: React.FC<HeartsProps> = ({ count }) => {
  return (
    <div className="flex items-center ml-4">
      <HeartIcon />
      <span className="text-red-500 font-bold text-xl ml-1">{count}</span>
    </div>
  );
};

export default Hearts;
