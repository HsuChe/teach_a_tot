import React, { useState, useEffect, useMemo } from 'react';
import type { LearningSlide } from '../types';

interface LearningCardProps {
  slide: LearningSlide;
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const renderHighlightedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[\[.*?\]\])/g).filter(part => part);
    return parts.map((part, index) => {
        if (part.startsWith('[[') && part.endsWith(']]')) {
            const word = part.slice(2, -2);
            return (
                <strong key={index} className="text-blue-600 dark:text-blue-400 font-bold bg-blue-100 dark:bg-blue-900/50 rounded px-1 mx-px">
                    {word}
                </strong>
            );
        }
        return <span key={index}>{part}</span>;
    });
};

const LearningCard: React.FC<LearningCardProps> = ({ slide, onNext, onBack, isFirst, isLast }) => {
  const [revealedWords, setRevealedWords] = useState<Set<string>>(new Set());

  const { parts, hiddenWordsCount } = useMemo(() => {
    // This regex splits the string by the [[...]] delimiters, keeping the delimiters.
    // e.g., "The capital is [[Paris]]." becomes ["The capital is ", "[[Paris]]", "."]
    const contentParts = slide.content.split(/(\[\[.*?\]\])/g).filter(part => part);
    const hidden = contentParts.filter(p => p.startsWith('[[') && p.endsWith(']]'));
    
    // Create a Set to handle cases where the same word is hidden multiple times.
    const uniqueWords = new Set(hidden.map(h => h.slice(2, -2)));
    
    return { 
      parts: contentParts, 
      hiddenWordsCount: uniqueWords.size,
    };
  }, [slide.content]);
  
  // Reset revealed words when the slide content changes
  useEffect(() => {
    setRevealedWords(new Set());
  }, [slide.content]);

  const handleReveal = (word: string) => {
    setRevealedWords(prev => new Set(prev).add(word));
  };
  
  const allRevealed = revealedWords.size === hiddenWordsCount;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg min-h-[400px] flex flex-col justify-between mb-4 animate-fade-in">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-800 dark:text-slate-200">{renderHighlightedText(slide.title)}</h2>
        <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
          {parts.map((part, index) => {
            if (!part.startsWith('[[') || !part.endsWith(']]')) {
              return <span key={index}>{part}</span>;
            }
            
            const word = part.slice(2, -2);
            const isRevealed = revealedWords.has(word);

            if (isRevealed) {
              return <strong key={index} className="text-blue-600 dark:text-blue-400 font-bold animate-fade-in-fast mx-px bg-blue-100 dark:bg-blue-900/50 rounded px-1"> {word} </strong>
            }

            return (
              <button
                key={index}
                onClick={() => handleReveal(word)}
                style={{ minWidth: `${word.length * 0.6}em`}}
                className="inline-block align-baseline bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 font-bold rounded-md px-2 py-0 mx-1 transition-colors cursor-pointer"
              >
                ...
              </button>
            )
          })}
        </p>
      </div>
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={onBack}
          disabled={isFirst}
          className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 px-6 rounded-xl text-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!allRevealed}
          className="bg-blue-500 text-white font-bold py-3 px-6 rounded-xl text-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLast ? "Start Quiz!" : "Next"}
        </button>
      </div>
    </div>
  );
};

export default LearningCard;