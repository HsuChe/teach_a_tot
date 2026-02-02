import React, { useEffect } from 'react';
import { StarIcon } from './icons';

interface LessonSummaryProps {
  score: number;
  totalQuestions: number;
  points: number;
  perfectHealth: boolean;
  onFinish: () => void;
  onTryAgain: () => void;
  onExitToTopics: () => void;
  isCurriculumMode?: boolean;
  isLastSectionInChapter?: boolean;
  isLastChapterInCurriculum?: boolean;
}

declare const confetti: any;

const LessonSummary: React.FC<LessonSummaryProps> = ({ 
  score, totalQuestions, points, perfectHealth, onFinish, onTryAgain, onExitToTopics,
  isCurriculumMode, isLastSectionInChapter, isLastChapterInCurriculum
}) => {
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const failed = percentage < 50;

  useEffect(() => {
    if (!failed && typeof confetti === 'function') {
        const duration = 2 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
        
        return () => clearInterval(interval);
    }
  }, [failed]);

  if (failed) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center animate-fade-in">
        <h2 className="text-3xl font-extrabold text-red-600 mb-2">Keep Practicing!</h2>
        <p className="text-xl font-bold text-slate-700 mb-4">You'll get it next time.</p>
        
        <div className="bg-slate-100 p-4 rounded-xl mb-6">
          <p className="text-lg text-slate-600">You scored</p>
          <p className="text-5xl font-bold text-red-500 my-2">{percentage}%</p>
          <p className="text-slate-500">You need 50% or more to continue.</p>
        </div>

        <button
          onClick={onTryAgain}
          className="w-full sm:w-auto font-bold py-3 px-8 rounded-full text-lg transition-colors bg-blue-500 hover:bg-blue-600 text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  let message = "Great effort!";
  if (percentage === 100) {
      message = "Perfect! You're a star!";
  } else if (percentage >= 75) {
      message = "Excellent work!";
  } else if (percentage >= 50) {
      message = "Good job! Keep practicing!";
  }

  const getContinueButtonText = () => {
    if (!isCurriculumMode) {
      return 'Next Lesson';
    }
    if (isLastSectionInChapter && isLastChapterInCurriculum) {
      return 'Finish Curriculum';
    }
    if (isLastSectionInChapter) {
        return 'Next Chapter';
    }
    return 'Next Section';
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg text-center animate-fade-in">
      <div className="flex justify-center mb-4">
        <StarIcon />
      </div>
      <h2 className="text-3xl font-extrabold text-blue-600 mb-2">Section Complete!</h2>
      <p className="text-xl font-bold text-slate-700 mb-4">{message}</p>
      
      <div className="bg-slate-100 p-4 rounded-xl mb-6">
        <p className="text-lg text-slate-600">You scored</p>
        <p className="text-5xl font-bold text-green-500 my-2">{percentage}%</p>
        <p className="text-slate-500">({score} / {totalQuestions} correct)</p>
      </div>

      <div className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-200">
        <p className="text-lg text-slate-600">You earned</p>
        <p className="text-5xl font-bold text-blue-500 my-2">{points}</p>
        <p className="text-slate-500">points</p>
        {perfectHealth && (
            <p className="text-green-600 font-bold mt-2 animate-pulse">
                Perfect Health Bonus! +50
            </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
        <button
          onClick={onTryAgain}
          className="font-bold py-3 px-8 rounded-full text-lg transition-colors bg-slate-200 hover:bg-slate-300 text-slate-700"
        >
          Try Again
        </button>
        
        <button
          onClick={onExitToTopics}
          className="font-bold py-3 px-8 rounded-full text-lg transition-colors bg-slate-200 hover:bg-slate-300 text-slate-700"
        >
          {isCurriculumMode ? 'Choose Another Topic' : 'Back to Topics'}
        </button>

        <button
          onClick={onFinish}
          className="font-bold py-3 px-8 rounded-full text-lg transition-colors bg-blue-500 hover:bg-blue-600 text-white"
        >
          {getContinueButtonText()}
        </button>
      </div>
    </div>
  );
};

export default LessonSummary;