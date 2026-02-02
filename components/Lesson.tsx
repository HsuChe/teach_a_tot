import React, { useState, useEffect, useCallback } from 'react';
import type { SectionData, LearningSlide, TeachingPrompt, Question, Source } from '../types';
import { QuestionType, MathInteractionType } from '../types';
import { INITIAL_HEARTS } from '../constants';
import QuestionCard from './QuestionCard';
import LearningCard from './LearningCard';
import TeachingCard from './TeachingCard';
import CalculationPad from './CalculationPad';
import EquationBalancer from './EquationBalancer';
import GraphingCanvas from './GraphingCanvas';
import GeometricSandbox from './GeometricSandbox';
import CalculusVisualizer from './CalculusVisualizer';
import StepProgressBar from './StepProgressBar';
import Hearts from './Hearts';
import LessonSummary from './LessonSummary';
import { evaluateFillInTheBlankAnswer } from '../services/geminiService';
import { CorrectIcon, IncorrectIcon, BookIcon } from './icons';

interface LessonProps {
  sectionData: SectionData;
  onFinish: () => void;
  onTryAgain: () => void;
  onExitToTopics: () => void;
  isCurriculumMode?: boolean;
  curriculumTitle?: string;
  chapterTitle?: string;
  sectionNumber?: number;
  totalSections?: number;
  chapterNumber?: number;
  totalChapters?: number;
  isLastSectionInChapter?: boolean;
  isLastChapterInCurriculum?: boolean;
  sources?: Source[];
  onUpdateKnowledge?: (conceptId: string, isCorrect: boolean) => void;
}

type AnswerStatus = 'unanswered' | 'correct' | 'incorrect';
type LessonPhase = 'learning' | 'assessment';
type AssessmentItem = TeachingPrompt | Question;

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

const Lesson: React.FC<LessonProps> = ({ 
  sectionData, onFinish, onTryAgain, onExitToTopics,
  isCurriculumMode, curriculumTitle, chapterTitle, sectionNumber, totalSections,
  isLastSectionInChapter, isLastChapterInCurriculum, sources
}) => {
  const { learningMaterial: learningSlides = [], teachingPrompts = [], questions = [] } = sectionData;

  const [phase, setPhase] = useState<LessonPhase>(learningSlides.length > 0 ? 'learning' : 'assessment');
  const [currentLearningIndex, setCurrentLearningIndex] = useState(0);
  const [assessmentItems, setAssessmentItems] = useState<AssessmentItem[]>([]);
  const [currentAssessmentIndex, setCurrentAssessmentIndex] = useState(0);

  const [hearts, setHearts] = useState(INITIAL_HEARTS);
  const [score, setScore] = useState(0);
  const [points, setPoints] = useState(0);
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('unanswered');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [finalLessonState, setFinalLessonState] = useState<{points: number, perfectHealth: boolean} | null>(null);
  const [reviewSlide, setReviewSlide] = useState<LearningSlide | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    // Separate items by type to control the lesson flow
    const teachingItems: AssessmentItem[] = teachingPrompts || [];
    const mcQuestions: AssessmentItem[] = (questions || []).filter(q => 'questionType' in q && (q as Question).questionType === QuestionType.MULTIPLE_CHOICE);
    const fibQuestions: AssessmentItem[] = (questions || []).filter(q => 'questionType' in q && (q as Question).questionType === QuestionType.FILL_IN_THE_BLANK);
    const mathQuestions: AssessmentItem[] = (questions || []).filter(q => 'questionType' in q && (q as Question).questionType === QuestionType.MATH_INTERACTION);

    // Shuffle each category independently
    const shuffle = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);
    const tats = shuffle(teachingItems);
    const mcs = shuffle(mcQuestions);
    const fibs = shuffle(fibQuestions);
    const maths = shuffle(mathQuestions);

    // Interleave the items to create a balanced difficulty curve (MC -> Math -> FIB -> TAT)
    const orderedItems: AssessmentItem[] = [];
    const total = tats.length + mcs.length + fibs.length + maths.length;

    // Weave the questions together in a pattern to prevent burnout
    while (orderedItems.length < total) {
        if (mcs.length > 0) orderedItems.push(mcs.shift()!);
        if (maths.length > 0) orderedItems.push(maths.shift()!);
        if (mcs.length > 0) orderedItems.push(mcs.shift()!);
        if (fibs.length > 0) orderedItems.push(fibs.shift()!);
        if (tats.length > 0) orderedItems.push(tats.shift()!);
    }
    setAssessmentItems(orderedItems);
    
    // Reset state when sectionData changes
    setPhase(learningSlides.length > 0 ? 'learning' : 'assessment');
    setCurrentLearningIndex(0);
    setCurrentAssessmentIndex(0);
    setHearts(INITIAL_HEARTS);
    setScore(0);
    setPoints(0);
    setAnswerStatus('unanswered');
    setSelectedAnswer(null);
    setIsFinished(false);
    setFinalLessonState(null);
    setReviewSlide(null);
  }, [sectionData, learningSlides, teachingPrompts, questions]);
  
  const totalLearningSlides = learningSlides.length;
  const totalAssessmentItems = assessmentItems.length;
  const totalSteps = totalLearningSlides + totalAssessmentItems;
  const currentStep = phase === 'learning' 
    ? currentLearningIndex + 1
    : totalLearningSlides + currentAssessmentIndex + 1;

  const finishLesson = useCallback(() => {
    if (isFinished) return;
    const perfectHealth = hearts === INITIAL_HEARTS;
    const bonus = perfectHealth ? 50 : 0;
    setFinalLessonState({
        points: points + bonus,
        perfectHealth: perfectHealth,
    });
    setIsFinished(true);
  }, [points, hearts, isFinished]);

  useEffect(() => {
    if (hearts <= 0) {
      finishLesson();
    }
  }, [hearts, finishLesson]);

  const handleNextAssessmentItem = () => {
    setAnswerStatus('unanswered');
    setSelectedAnswer(null);
    setReviewSlide(null);

    if (currentAssessmentIndex < totalAssessmentItems - 1) {
      setCurrentAssessmentIndex(prev => prev + 1);
    } else {
      finishLesson();
    }
  };

  const handleAnswerSubmit = async (answer: string) => {
    if (answerStatus !== 'unanswered' || isEvaluating) return;

    setSelectedAnswer(answer);
    const currentItem = assessmentItems[currentAssessmentIndex];
    if (!('questionType' in currentItem)) return;
    
    const currentQuestion = currentItem as Question;
    let isCorrect = false;

    if (currentQuestion.questionType === QuestionType.FILL_IN_THE_BLANK) {
        setIsEvaluating(true);
        try {
            const result = await evaluateFillInTheBlankAnswer(currentQuestion.questionText, currentQuestion.correctAnswer, answer);
            isCorrect = result.isCorrect;
        } catch (error) {
            console.error("Error evaluating answer:", error);
            isCorrect = answer.trim().toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
        } finally {
            setIsEvaluating(false);
        }
    } else {
        isCorrect = answer.trim().toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
    }

    if (isCorrect) {
      setAnswerStatus('correct');
      setScore(prev => prev + 1);
      setPoints(prev => prev + 10);
      setReviewSlide(null);
      if (onUpdateKnowledge) {
          const conceptId = learningSlides[currentQuestion.relatedSlideIndex]?.title || sectionData.title;
          onUpdateKnowledge(conceptId, true);
      }
    } else {
      setAnswerStatus('incorrect');
      setHearts(prev => prev - 1);
      
      if (currentQuestion.relatedSlideIndex !== undefined && learningSlides[currentQuestion.relatedSlideIndex]) {
        setReviewSlide(learningSlides[currentQuestion.relatedSlideIndex]);
        if (onUpdateKnowledge) {
            onUpdateKnowledge(learningSlides[currentQuestion.relatedSlideIndex].title, false);
        }
      } else {
        setReviewSlide(null);
        if (onUpdateKnowledge) {
            onUpdateKnowledge(sectionData.title, false);
        }
      }
    }
  };

  const handleNextSlide = () => {
    if (currentLearningIndex < totalLearningSlides - 1) {
      setCurrentLearningIndex(prev => prev + 1);
    } else {
      setPhase('assessment');
    }
  };

  const handleBackSlide = () => {
    if (currentLearningIndex > 0) {
      setCurrentLearningIndex(prev => prev - 1);
    }
  };
  
  const handleTeachingComplete = () => {
    setPoints(prev => prev + 15); // Points for successfully teaching
    handleNextAssessmentItem();
  };

  if (isFinished && finalLessonState) {
    const questionsAnswered = assessmentItems.filter(item => 'questionType' in item).length;
    return (
        <LessonSummary 
            score={score} 
            totalQuestions={questionsAnswered} 
            points={finalLessonState.points}
            perfectHealth={finalLessonState.perfectHealth}
            onFinish={onFinish} 
            onTryAgain={onTryAgain} 
            onExitToTopics={onExitToTopics}
            isCurriculumMode={isCurriculumMode}
            isLastSectionInChapter={isLastSectionInChapter}
            isLastChapterInCurriculum={isLastChapterInCurriculum}
        />
    );
  }

  const feedbackBgColor = answerStatus === 'correct' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-50 dark:bg-red-900/50';
  const feedbackTextColor = answerStatus === 'correct' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300';
  const feedbackBorderColor = answerStatus === 'correct' ? 'border-green-500 dark:border-green-700' : 'border-red-300 dark:border-red-700';
  const continueButtonColor = answerStatus === 'correct' ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600';

  const renderAssessmentItem = () => {
    if (!assessmentItems[currentAssessmentIndex]) return null;

    const currentItem = assessmentItems[currentAssessmentIndex];

    if ('promptText' in currentItem) {
      return (
        <TeachingCard
          key={currentAssessmentIndex}
          prompt={currentItem as TeachingPrompt}
          lessonSlides={learningSlides}
          onComplete={handleTeachingComplete}
        />
      );
    }

    if ('questionType' in currentItem) {
      const currentQuestion = currentItem as Question;
      let cardContent;

      if (currentQuestion.questionType === QuestionType.MATH_INTERACTION) {
        switch (currentQuestion.interactionType) {
            case MathInteractionType.CALCULATION_PAD:
                cardContent = (
                    <CalculationPad
                        question={currentQuestion}
                        onSubmit={handleAnswerSubmit}
                        answerStatus={answerStatus}
                        selectedAnswer={selectedAnswer}
                    />
                );
                break;
            case MathInteractionType.EQUATION_BALANCER:
                cardContent = (
                    <EquationBalancer
                        question={currentQuestion}
                        onSubmit={handleAnswerSubmit}
                        answerStatus={answerStatus}
                        selectedAnswer={selectedAnswer}
                    />
                );
                break;
            case MathInteractionType.GRAPHING_CANVAS:
                cardContent = (
                    <GraphingCanvas
                        question={currentQuestion}
                        onSubmit={handleAnswerSubmit}
                        answerStatus={answerStatus}
                        selectedAnswer={selectedAnswer}
                    />
                );
                break;
            case MathInteractionType.GEOMETRIC_SANDBOX:
                cardContent = (
                    <GeometricSandbox
                        question={currentQuestion}
                        onSubmit={handleAnswerSubmit}
                        answerStatus={answerStatus}
                    />
                );
                break;
            case MathInteractionType.CALCULUS_VISUALIZER:
                cardContent = (
                    <CalculusVisualizer
                        question={currentQuestion}
                        onSubmit={handleAnswerSubmit}
                        answerStatus={answerStatus}
                    />
                );
                break;
            default:
                cardContent = <div className="p-6"><p>This interactive math question is coming soon!</p></div>;
        }
      } else {
        cardContent = (
            <QuestionCard 
                question={currentQuestion}
                lessonSlides={learningSlides}
                onSubmit={handleAnswerSubmit}
                answerStatus={answerStatus}
                selectedAnswer={selectedAnswer}
                isEvaluating={isEvaluating}
            />
        );
      }
      
      return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg animate-fade-in">
          {cardContent}
          {answerStatus !== 'unanswered' && (
            <div className={`p-4 sm:p-6 border-t-4 ${feedbackBorderColor} ${feedbackBgColor}`}>
              <div className="flex items-start">
                {answerStatus === 'correct' ? <CorrectIcon /> : <IncorrectIcon />}
                <div className="ml-3">
                  <h3 className={`text-lg font-extrabold ${feedbackTextColor}`}>
                    {answerStatus === 'correct' ? 'Correct!' : 'Nice try!'}
                  </h3>
                  <p className={`mt-1 text-sm font-semibold ${feedbackTextColor}`}>
                    {renderHighlightedText(currentQuestion.explanation)}
                  </p>
                </div>
              </div>
              {answerStatus === 'incorrect' && reviewSlide && (
                <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                  <div className="flex items-center text-slate-700 dark:text-slate-300 font-bold mb-2">
                    <BookIcon />
                    <h4 className="ml-2 text-lg">Let's Review</h4>
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-3 rounded-lg text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                    <p className="font-bold text-sm">{renderHighlightedText(reviewSlide.title)}</p>
                    <p className="text-sm mt-1">{renderHighlightedText(reviewSlide.content)}</p>
                  </div>
                </div>
              )}
              <button 
                onClick={handleNextAssessmentItem} 
                className={`w-full mt-4 text-white font-bold py-3 px-4 rounded-xl text-lg ${continueButtonColor} transition-colors`}
              >
                Continue
              </button>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative">
      {isCurriculumMode ? (
        <div className="text-center mb-3 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border dark:border-slate-700">
          <h2 className="text-lg font-bold text-blue-600 dark:text-blue-400 truncate">{curriculumTitle}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">Chapter: {chapterTitle}</p>
          <p className="text-slate-700 dark:text-slate-300 font-bold mt-1">Section {sectionNumber} of {totalSections}: {sectionData.title}</p>
        </div>
      ) : (
        <div className="text-center mb-3">
            <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">{sectionData.title}</h2>
        </div>
      )}

      <div className="flex justify-between items-center mb-4 px-2">
        <StepProgressBar current={currentStep} total={totalSteps} />
        <Hearts count={hearts} />
      </div>

      {phase === 'learning' && totalLearningSlides > 0 && (
        <LearningCard 
          slide={learningSlides[currentLearningIndex]}
          onNext={handleNextSlide}
          onBack={handleBackSlide}
          isFirst={currentLearningIndex === 0}
          isLast={currentLearningIndex === totalLearningSlides - 1}
        />
      )}

      {phase === 'assessment' && totalAssessmentItems > 0 && renderAssessmentItem()}

      {sources && sources.length > 0 && (
        <div className="mt-8 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Sources</h3>
            <ul className="list-disc list-inside space-y-1">
                {sources.map((source, index) => (
                    <li key={index} className="text-sm text-slate-600 dark:text-slate-400">
                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                            {source.title}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
      )}
    </div>
  );
};

export default Lesson;