import React from 'react';
import type { Curriculum } from '../types';
import { BookIcon } from './icons';

interface CurriculumProgressPanelProps {
    curriculum: Curriculum;
    currentChapterIndex: number;
    currentSectionIndex: number;
}

const CurriculumProgressPanel: React.FC<CurriculumProgressPanelProps> = ({ curriculum, currentChapterIndex, currentSectionIndex }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 animate-fade-in">
            <h2 className="flex items-center text-xl font-extrabold text-blue-600 dark:text-blue-400 border-b dark:border-slate-700 pb-3 mb-4">
                <BookIcon />
                <span className="ml-2">Curriculum Progress</span>
            </h2>
            <div className="space-y-4">
                {curriculum.chapters.map((chapter, chapIndex) => {
                    const isCurrentChapter = chapIndex === currentChapterIndex;
                    const isCompletedChapter = chapIndex < currentChapterIndex;
                    
                    return (
                        <div key={chapIndex}>
                            <h3 className={`font-bold text-lg ${isCurrentChapter ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                                {isCompletedChapter ? '✅' : '➡️'} Chapter {chapIndex + 1}: {chapter.title}
                            </h3>
                            <ul className="mt-2 pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-1">
                                {chapter.sections.map((section, secIndex) => {
                                    const isCurrentSection = isCurrentChapter && secIndex === currentSectionIndex;
                                    const isCompletedSection = isCompletedChapter || (isCurrentChapter && secIndex < currentSectionIndex);

                                    let statusClasses = 'text-slate-500 dark:text-slate-400';
                                    if (isCurrentSection) {
                                        statusClasses = 'font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50';
                                    } else if (isCompletedSection) {
                                        statusClasses = 'text-green-600 dark:text-green-400 line-through';
                                    }

                                    return (
                                        <li key={secIndex} className={`text-sm p-1 rounded-md transition-colors ${statusClasses}`}>
                                            {section.title}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CurriculumProgressPanel;
