
import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons';

interface TopicSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    allTopics: string[];
    selectedTopics: string[];
    onSave: (newTopics: string[]) => void;
}

const TopicSettingsModal: React.FC<TopicSettingsModalProps> = ({ isOpen, onClose, allTopics, selectedTopics, onSave }) => {
    const [internalSelection, setInternalSelection] = useState<Set<string>>(new Set(selectedTopics));

    useEffect(() => {
        if (isOpen) {
            setInternalSelection(new Set(selectedTopics));
        }
    }, [isOpen, selectedTopics]);

    const handleToggle = (topic: string) => {
        const newSelection = new Set(internalSelection);
        if (newSelection.has(topic)) {
            newSelection.delete(topic);
        } else {
            newSelection.add(topic);
        }
        setInternalSelection(newSelection);
    };
    
    const handleSave = () => {
        onSave(Array.from(internalSelection));
        onClose();
    };

    const handleDeselectAll = () => {
        setInternalSelection(new Set());
    }

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in-fast"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold">Topic Category Settings</h2>
                    <button onClick={onClose} className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                        <CloseIcon />
                    </button>
                </header>
                <main className="p-6 flex-grow overflow-y-auto">
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                        Select the categories you're interested in to personalize your Explore feed.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {allTopics.map(topic => (
                            <label key={topic} className="flex items-center gap-2 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <input 
                                    type="checkbox"
                                    checked={internalSelection.has(topic)}
                                    onChange={() => handleToggle(topic)}
                                    className="h-5 w-5 rounded text-blue-500 focus:ring-blue-400 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                                />
                                <span className="font-semibold">{topic}</span>
                            </label>
                        ))}
                    </div>
                </main>
                <footer className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center gap-2 flex-shrink-0">
                    <button 
                        onClick={handleDeselectAll}
                        className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        Deselect All
                    </button>
                    <button 
                        onClick={handleSave}
                        className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Save Changes
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default TopicSettingsModal;
