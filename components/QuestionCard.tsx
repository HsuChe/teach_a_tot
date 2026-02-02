import React, { useState, useRef, useEffect } from 'react';
import type { Question, LearningSlide } from '../types';
import { QuestionType } from '../types';
import { HintIcon } from './icons';

interface QuestionCardProps {
  question: Question;
  lessonSlides: LearningSlide[];
  onSubmit: (answer: string) => void;
  answerStatus: 'unanswered' | 'correct' | 'incorrect';
  selectedAnswer: string | null;
  isEvaluating?: boolean;
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


const QuestionCard: React.FC<QuestionCardProps> = ({ question, lessonSlides, onSubmit, answerStatus, selectedAnswer, isEvaluating }) => {
    const [inputValue, setInputValue] = useState('');
    const [hintLevel, setHintLevel] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string>('');
    const [selectedDefinition, setSelectedDefinition] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const hintSlide = question.relatedSlideIndex !== undefined ? lessonSlides[question.relatedSlideIndex] : null;

    useEffect(() => {
        setInputValue('');
        setHintLevel(0);
        setSelectedOption('');
        setSelectedDefinition(null);
        if (question.questionType === QuestionType.FILL_IN_THE_BLANK && inputRef.current) {
            inputRef.current.focus();
        }
    }, [question]);
    
    const handleMcClick = (optionText: string) => {
        if (answerStatus !== 'unanswered') return;
        setSelectedOption(optionText);
        const optionData = question.options?.find(opt => opt.text === optionText);
        setSelectedDefinition(optionData ? optionData.definition : null);
    };
    
    const handleMcSubmit = () => {
        if(selectedOption) {
            onSubmit(selectedOption);
        }
    };
    
    const handleFitbSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onSubmit(inputValue.trim());
        }
    };

    const renderFillInTheBlankBody = () => {
        const parts = question.questionText.split('___');
        return (
            <div className="text-xl md:text-2xl text-center flex flex-wrap items-center justify-center leading-relaxed">
                <span>{renderHighlightedText(parts[0])}</span>
                <form onSubmit={handleFitbSubmit} className="inline-block mx-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={answerStatus !== 'unanswered' || isEvaluating}
                        className="p-1 border-b-2 border-slate-400 dark:border-slate-500 focus:border-blue-500 dark:focus:border-blue-400 outline-none text-center bg-transparent w-32"
                        autoFocus
                    />
                </form>
                <span>{parts[1] && renderHighlightedText(parts[1])}</span>
            </div>
        );
    };
    
    const getDefinitionBoxClass = () => {
        if (answerStatus === 'unanswered' || !selectedAnswer) return "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-700/50";
        if (selectedAnswer === question.correctAnswer) return "border-green-300 bg-green-50 ring-2 ring-green-200 dark:border-green-700 dark:bg-green-900/30";
        return "border-red-300 bg-red-50 ring-2 ring-red-200 dark:border-red-700 dark:bg-red-900/30";
    }

    return (
        <div className="p-6 min-h-[350px] flex flex-col justify-between">
            <div>
                <h2 className="text-xl md:text-2xl font-bold mb-6 text-slate-800 dark:text-slate-200 leading-relaxed">
                    {question.questionType === QuestionType.FILL_IN_THE_BLANK && question.title 
                        ? renderHighlightedText(question.title) 
                        : renderHighlightedText(question.questionText)
                    }
                </h2>

                {question.questionType === QuestionType.MULTIPLE_CHOICE && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {question.options?.map((option, index) => {
                                const isSelected = selectedOption === option.text;
                                let buttonClass = 'bg-white hover:bg-slate-100 border-slate-300 dark:bg-white dark:hover:bg-slate-200 dark:border-transparent text-slate-800';

                                if (answerStatus === 'unanswered' && isSelected) {
                                    buttonClass = 'bg-blue-100 border-blue-400 ring-2 ring-blue-200 dark:bg-blue-200 dark:border-blue-500 text-slate-800';
                                } else if (answerStatus !== 'unanswered' && option.text === question.correctAnswer) {
                                    buttonClass = 'bg-green-100 border-green-400 ring-2 ring-green-200 dark:bg-green-200 dark:border-green-500 text-green-800';
                                } else if (answerStatus === 'incorrect' && isSelected) {
                                    buttonClass = 'bg-red-100 border-red-400 ring-2 ring-red-200 dark:bg-red-200 dark:border-red-500 text-red-800';
                                } else if (answerStatus !== 'unanswered') {
                                    buttonClass += ' opacity-50';
                                }

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleMcClick(option.text)}
                                        disabled={answerStatus !== 'unanswered'}
                                        className={`w-full p-4 border-2 rounded-xl text-lg text-left font-semibold transition-all duration-200 disabled:cursor-not-allowed ${buttonClass}`}
                                    >
                                        {option.text}
                                    </button>
                                );
                            })}
                        </div>

                        {selectedDefinition && (
                            <div className={`p-4 border rounded-xl animate-fade-in-fast mt-4 ${getDefinitionBoxClass()}`}>
                                <p className="font-bold text-slate-800 dark:text-slate-200">Definition:</p>
                                <p className="text-slate-600 dark:text-slate-400">{selectedDefinition}</p>
                            </div>
                        )}
                        
                        {answerStatus === 'incorrect' && selectedOption !== question.correctAnswer && (
                            <div className="p-4 border rounded-xl animate-fade-in-fast border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/30">
                                <p className="font-bold text-green-800 dark:text-green-300">Correct Answer's Definition:</p>
                                <p className="text-slate-600 dark:text-slate-300">
                                  <strong className="dark:text-slate-100">{question.correctAnswer}:</strong> {question.options?.find(o => o.text === question.correctAnswer)?.definition}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {question.questionType === QuestionType.FILL_IN_THE_BLANK && renderFillInTheBlankBody()}
            </div>

            <div className="mt-8">
                {question.questionType === QuestionType.MULTIPLE_CHOICE && answerStatus === 'unanswered' && (
                    <button 
                        onClick={handleMcSubmit}
                        disabled={!selectedOption}
                        className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-lg hover:bg-blue-600 transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                        Check
                    </button>
                )}

                {question.questionType === QuestionType.FILL_IN_THE_BLANK && answerStatus === 'unanswered' && (
                    <>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setHintLevel(prev => prev + 1)}
                                disabled={isEvaluating}
                                className="flex items-center justify-center gap-2 font-bold p-3 rounded-full text-sm transition-colors bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 disabled:opacity-50"
                                aria-label="Show hint"
                            >
                                <HintIcon />
                                <span>{hintLevel > 0 ? 'Show Answer' : 'Hint'}</span>
                            </button>
                            <button 
                                onClick={handleFitbSubmit}
                                disabled={!inputValue.trim() || isEvaluating}
                                className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-lg hover:bg-blue-600 transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 disabled:cursor-not-allowed flex justify-center items-center min-h-[50px]"
                            >
                                {isEvaluating ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    'Check'
                                )}
                            </button>
                        </div>
                        {hintLevel > 0 && hintSlide && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in-fast dark:bg-blue-900/50 dark:border-blue-700">
                                <p className="font-bold text-sm text-blue-700 dark:text-blue-300">Hint: {renderHighlightedText(hintSlide.title)}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{renderHighlightedText(hintSlide.content)}</p>
                            </div>
                        )}
                        {hintLevel > 1 && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg animate-fade-in-fast dark:bg-green-900/50 dark:border-green-700">
                                <p className="font-bold text-sm text-green-800 dark:text-green-300">The answer is: <span className="p-1 bg-green-200 dark:bg-green-800 rounded">{question.correctAnswer}</span></p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default QuestionCard;