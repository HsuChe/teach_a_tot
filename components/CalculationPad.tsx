import React, { useState, useEffect } from 'react';
import type { Question } from '../types';

interface CalculationPadProps {
  question: Question;
  onSubmit: (answer: string) => void;
  answerStatus: 'unanswered' | 'correct' | 'incorrect';
  selectedAnswer: string | null;
}

const CalculationPad: React.FC<CalculationPadProps> = ({ question, onSubmit, answerStatus, selectedAnswer }) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setInputValue('');
  }, [question]);

  const handleInput = (value: string) => {
    if (answerStatus !== 'unanswered') return;
    if (value === '.' && inputValue.includes('.')) return;
    setInputValue(prev => prev + value);
  };

  const handleBackspace = () => {
    if (answerStatus !== 'unanswered') return;
    setInputValue(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (answerStatus !== 'unanswered') return;
    setInputValue('');
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSubmit(inputValue.trim());
    }
  };

  const expression = question.initialState?.expression;
  const questionText = question.questionText;

  const getInputBorderClass = () => {
    if (answerStatus === 'unanswered') {
      return 'border-slate-300 dark:border-slate-600 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200';
    }
    if (answerStatus === 'correct') {
      return 'border-green-500 dark:border-green-600 ring-2 ring-green-200 dark:ring-green-800 bg-green-50 dark:bg-green-900/30';
    }
    return 'border-red-500 dark:border-red-600 ring-2 ring-red-200 dark:ring-red-800 bg-red-50 dark:bg-red-900/30';
  };

  const getInputValueClass = () => {
    if (answerStatus === 'correct') return 'text-green-800 dark:text-green-300';
    if (answerStatus === 'incorrect') return 'text-red-800 dark:text-red-300';
    return 'text-slate-800 dark:text-slate-200';
  }

  const buttons = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0'];

  return (
    <div className="p-6 flex flex-col items-center">
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200 text-center">{questionText}</h2>
      <p className="text-3xl md:text-4xl font-mono font-bold text-blue-600 dark:text-blue-400 mb-6 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg shadow-inner">
        {expression}
      </p>

      <div className={`w-full max-w-sm mb-6 p-4 border-2 rounded-xl text-3xl font-mono text-right transition-all ${getInputBorderClass()}`}>
        <span className={getInputValueClass()}>{inputValue || '0'}</span>
        <span className="animate-blink">|</span>
      </div>

      <div className="grid grid-cols-4 gap-2 w-full max-w-sm">
        <button onClick={handleClear} disabled={answerStatus !== 'unanswered'} className="col-span-2 text-xl font-bold p-4 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition disabled:opacity-50">AC</button>
        <button onClick={handleBackspace} disabled={answerStatus !== 'unanswered'} className="col-span-2 text-xl font-bold p-4 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition disabled:opacity-50">⌫</button>
        
        {buttons.map(num => (
          <button 
            key={num} 
            onClick={() => handleInput(num)} 
            disabled={answerStatus !== 'unanswered'} 
            className={`text-2xl font-bold p-4 rounded-lg transition disabled:opacity-50 ${num === '.' ? 'bg-slate-100 dark:bg-slate-700' : 'bg-white dark:bg-slate-700/50'} hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600`}
          >
            {num}
          </button>
        ))}
        
        <div className="col-span-1"></div> {/* Placeholder for layout */}
      </div>

      {answerStatus === 'unanswered' && (
        <button 
          onClick={handleSubmit} 
          disabled={!inputValue.trim()}
          className="mt-6 w-full max-w-sm bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-lg hover:bg-blue-600 transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          Check
        </button>
      )}
    </div>
  );
};

export default CalculationPad;