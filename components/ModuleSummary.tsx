
import React from 'react';
import { SearchIcon } from './icons';

interface ModuleSummaryProps {
    moduleNumber: number;
    totalModules: number;
    relatedTopics: string[] | null;
    onStartNextModule: () => void;
    onSelectRelatedTopic: (topic: string) => void;
    onChooseNewTopic: () => void; // This will go to topic selection
    onBackToExplore: () => void; // This will go to home
}

const ModuleSummary: React.FC<ModuleSummaryProps> = ({
    moduleNumber,
    totalModules,
    relatedTopics,
    onStartNextModule,
    onSelectRelatedTopic,
    onChooseNewTopic,
    onBackToExplore,
}) => {
    const hasNextModule = moduleNumber < totalModules;

    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg text-center animate-fade-in">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mb-2">Module {moduleNumber} Complete!</h2>
            <p className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-6">You're making great progress. What's next?</p>

            <div className="space-y-4">
                {hasNextModule && (
                    <button
                        onClick={onStartNextModule}
                        className="w-full font-bold py-4 px-8 rounded-xl text-lg transition-colors bg-green-500 hover:bg-green-600 text-white shadow-lg"
                    >
                        Start Next Module ({moduleNumber + 1} of {totalModules})
                    </button>
                )}

                {relatedTopics && relatedTopics.length > 0 && (
                    <div className="pt-4">
                        <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400 mb-3">Explore Related Topics</h3>
                        <div className="flex flex-col gap-2">
                            {relatedTopics.map((topic, index) => (
                                <button
                                    key={index}
                                    onClick={() => onSelectRelatedTopic(topic)}
                                    className="w-full text-left p-3 bg-slate-100 dark:bg-slate-700/50 border border-transparent rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors font-semibold"
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <button
                        onClick={onChooseNewTopic}
                        className="w-full font-bold py-3 px-6 rounded-xl text-lg transition-colors bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                    >
                        Create a New Lesson
                    </button>
                    <button
                        onClick={onBackToExplore}
                        className="w-full flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-xl text-lg transition-colors bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                    >
                        <SearchIcon />
                        <span>Back to Explore</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModuleSummary;