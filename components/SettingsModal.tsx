import React, { useState } from 'react';
import type { HistoryItem, Curriculum, Chapter, SectionData, LearningSlide, Question } from '../types';
import { CloseIcon } from './icons';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: HistoryItem[];
    onClearHistory: () => void;
}

const Collapsible: React.FC<{ title: string, subtitle?: string, children: React.ReactNode, defaultOpen?: boolean, headerClass?: string }> = ({ title, subtitle, children, defaultOpen = false, headerClass = "bg-slate-100" }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg mb-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full text-left p-3 ${headerClass} hover:bg-slate-200 dark:hover:bg-slate-600 flex justify-between items-center transition-colors`}
            >
                <div>
                    <p className="font-bold">{title}</p>
                    {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
                </div>
                <span className={`transform transition-transform text-lg ${isOpen ? 'rotate-90' : 'rotate-0'}`}>›</span>
            </button>
            {isOpen && <div className="p-3">{children}</div>}
        </div>
    );
};

const SlideInspector: React.FC<{ slide: LearningSlide, index: number }> = ({ slide, index }) => (
    <div className="p-2 border-b dark:border-slate-700">
        <p className="font-semibold text-sm">Slide {index + 1}: {slide.title}</p>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{slide.content}</p>
        {slide.visualAidDescription && <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Visual Idea: {slide.visualAidDescription}</p>}
    </div>
);

const QuestionInspector: React.FC<{ question: Question, index: number }> = ({ question, index }) => (
    <div className="p-2 border-b dark:border-slate-700">
        <p className="font-semibold text-sm">Question {index + 1}: {question.questionText}</p>
        <p className="text-xs text-green-700 bg-green-50 dark:bg-green-900/50 dark:text-green-300 p-1 rounded mt-1">Answer: {question.correctAnswer}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Explanation: {question.explanation}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Related Slide Index: {question.relatedSlideIndex}</p>
    </div>
);

const SectionInspector: React.FC<{ section: SectionData, index: number }> = ({ section, index }) => (
    <Collapsible title={`Section ${index + 1}: ${section.title}`} headerClass="bg-blue-50 dark:bg-blue-900/20">
        <Collapsible title="Learning Slides" defaultOpen>
            {section.learningMaterial.map((slide, i) => <SlideInspector key={i} slide={slide} index={i} />)}
        </Collapsible>
        <Collapsible title="Quiz Questions" defaultOpen>
            {section.questions.map((q, i) => <QuestionInspector key={i} question={q} index={i} />)}
        </Collapsible>
    </Collapsible>
);

const ChapterInspector: React.FC<{ chapter: Chapter, index: number }> = ({ chapter, index }) => (
    <Collapsible title={`Chapter ${index + 1}: ${chapter.title}`} headerClass="bg-green-50 dark:bg-green-900/20">
        {chapter.sections.map((section, i) => <SectionInspector key={i} section={section} index={i} />)}
    </Collapsible>
);

const CurriculumInspector: React.FC<{ item: HistoryItem }> = ({ item }) => {
    if (item.type !== 'curriculum') {
         // Fallback for single lessons in history for now
        return (
            <Collapsible title={item.title} subtitle={`ID: ${item.id}`} headerClass="bg-slate-100 dark:bg-slate-700">
                <pre className="text-xs whitespace-pre-wrap overflow-x-auto bg-slate-800 text-white p-2 rounded">
                    <code>{JSON.stringify(item.lessonData, null, 2)}</code>
                </pre>
            </Collapsible>
        );
    }
    const { curriculum } = item;
    return (
        <Collapsible title={curriculum.title} subtitle={`Curriculum ID: ${item.id}`} defaultOpen headerClass="bg-slate-100 dark:bg-slate-700">
           {curriculum.chapters.map((chapter, i) => <ChapterInspector key={i} chapter={chapter} index={i} />)}
        </Collapsible>
    );
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, history, onClearHistory }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold">Settings & Data Inspector</h2>
                    <button onClick={onClose} className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                        <CloseIcon />
                    </button>
                </header>
                <main className="p-4 flex-grow overflow-y-auto">
                    <h3 className="font-bold text-lg mb-2">Generated Lesson Cache</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Examine the hierarchical structure of your generated curriculums. You can drill down from chapters to sections to individual learning slides and quiz questions to ensure factual accuracy.
                    </p>
                    {history.length > 0 ? (
                        <div className="space-y-2">
                           {history.map(item => <CurriculumInspector key={item.id} item={item} />)}
                        </div>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-center py-8">No lesson history found.</p>
                    )}
                </main>
                <footer className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <button 
                        onClick={onClearHistory}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                        Clear History & Cache
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SettingsModal;