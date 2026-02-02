import React, { useState, useCallback, useEffect } from 'react';
import type { TeachingPrompt, LearningSlide } from '../types';
import { evaluateExplanation } from '../services/geminiService';
import { HintIcon } from './icons';

// --- Character Component ---
type CharacterStatus = 'waiting' | 'thinking' | 'happy' | 'confused';

// Helper function to render text with highlighted sections
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

interface TeachATotCharacterProps {
  status: CharacterStatus;
}

const TeachATotCharacter: React.FC<TeachATotCharacterProps> = ({ status }) => {
    let mouthPath = 'M90 130 Q100 140 110 130'; // Neutral
    let containerClass = 'animate-gentle-bob';
    
    switch(status) {
        case 'thinking':
            mouthPath = 'M95 135 Q100 130 105 135'; // O mouth
            containerClass = 'is-thinking';
            break;
        case 'happy':
            mouthPath = 'M80 130 Q100 150 120 130'; // Big smile
            containerClass = 'is-happy';
            break;
        case 'confused':
            mouthPath = 'M90 135 Q100 130 110 135'; // Frown
            containerClass = 'is-confused';
            break;
        case 'waiting':
        default:
            // Default values are already set
            break;
    }

    return (
        <div id="character-container" className={`relative ${containerClass}`}>
            <svg id="character" className="w-48 h-auto" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 60 Q100 10 150 60 Q190 120 100 180 Q10 120 50 60 Z" fill="#ffcc99"/>
                <path d="M40 50 Q100 0 160 50 Q170 30 150 20 Q100 -10 50 20 Q30 30 40 50 Z" fill="#6b4f3b"/>
                <g id="eyes">
                    <circle id="left-eye" className="animate-blink" cx="75" cy="90" r="10" fill="#4a3a30"/>
                    <circle id="right-eye" className="animate-blink" cx="125" cy="90" r="10" fill="#4a3a30"/>
                </g>
                <path id="mouth" d={mouthPath} stroke="#4a3a30" strokeWidth="3" fill="none" strokeLinecap="round" className="transition-all" />
                <path d="M70 170 Q100 220 130 170 Z" fill="#89cff0"/>
            </svg>
            <div id="thinking-icon" className={`absolute -top-4 -right-4 text-4xl transition-opacity duration-300 ${status === 'thinking' ? 'opacity-100' : 'opacity-0'}`}>🤔</div>
        </div>
    );
};


// --- Main Component ---
interface TeachingCardProps {
  prompt: TeachingPrompt;
  lessonSlides: LearningSlide[];
  onComplete: () => void;
}

const phrases = {
    waiting: "I'm ready to learn something new!",
    thinking: "Hmm, let me think about that..."
};

const TeachingCard: React.FC<TeachingCardProps> = ({ prompt, lessonSlides, onComplete }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showExample, setShowExample] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [characterStatus, setCharacterStatus] = useState<CharacterStatus>('waiting');
  const [speechText, setSpeechText] = useState(phrases.waiting);
  
  const hintSlide = lessonSlides[prompt.relatedSlideIndex];

  const handleSubmit = useCallback(async () => {
    if (!userAnswer.trim()) return;

    setIsLoading(true);
    setCharacterStatus('thinking');
    setSpeechText(phrases.thinking);

    const result = await evaluateExplanation(prompt.promptText, userAnswer, hintSlide.content);

    setSpeechText(result.feedback);

    if (result.isCorrect) {
      setCharacterStatus('happy');
      setIsCorrect(true);
    } else {
      setFailedAttempts(prev => prev + 1);
      setCharacterStatus('confused');
      setShowHint(true);
      // After showing confusion, go back to waiting so the user can try again
      setTimeout(() => setCharacterStatus('waiting'), 4000); // Longer timeout to read feedback
    }

    setIsLoading(false);
  }, [userAnswer, prompt.promptText, hintSlide.content]);

  // Reset speech when card changes
  useEffect(() => {
    setCharacterStatus('waiting');
    setSpeechText(phrases.waiting);
  }, [prompt]);

  return (
    <div className="bg-blue-100 dark:bg-slate-900 p-4 rounded-2xl shadow-lg animate-fade-in font-poppins">
      <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-inner p-6">
        <header className="text-center mb-4">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Teach a Tot 🧸</h1>
          <h2 className="mt-4 text-xl font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{renderHighlightedText(prompt.promptText)}</h2>
        </header>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col items-center">
            <div className="speech-bubble relative w-full p-4 rounded-xl shadow-md min-h-[80px] text-center text-slate-700 dark:text-slate-200 font-semibold mb-4 transition-opacity duration-500">
              <span>{speechText}</span>
            </div>
            <TeachATotCharacter status={characterStatus} />
          </div>

          <div className="flex flex-col">
            <textarea
              id="lesson-input"
              rows={8}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={isLoading || isCorrect || showExample}
              className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-colors duration-300 resize-none shadow-inner bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
              placeholder="Explain the concept in your own words..."
            />
            
            {(showHint || showExample) && hintSlide && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg animate-fade-in-fast">
                  <p className="font-bold text-sm text-blue-700 dark:text-blue-400">{showExample ? "Here's a good explanation:" : "Hint:"} {renderHighlightedText(hintSlide.title)}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{renderHighlightedText(hintSlide.content)}</p>
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center justify-center gap-2 font-bold p-3 rounded-full text-sm transition-colors bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 disabled:opacity-50"
                disabled={isCorrect || showExample}
              >
                <HintIcon />
              </button>
              
              {isCorrect || showExample ? (
                <button
                    onClick={onComplete}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out"
                >
                    Continue!
                </button>
              ) : (
                <button
                    onClick={handleSubmit}
                    disabled={!userAnswer.trim() || isLoading}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:transform-none disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Thinking...' : 'Explain to the Tot'}
                </button>
              )}
            </div>
             {failedAttempts >= 2 && !isCorrect && !showExample && (
                <button
                    onClick={() => setShowExample(true)}
                    className="w-full mt-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-xl text-sm transition-colors"
                >
                    I'm stuck, show me an example explanation
                </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeachingCard;