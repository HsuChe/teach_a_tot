import React from 'react';
import { KnowledgeGraph } from '../types';

interface KnowledgeModalProps {
    isOpen: boolean;
    onClose: () => void;
    knowledgeGraph: KnowledgeGraph;
}

const KnowledgeModal: React.FC<KnowledgeModalProps> = ({ isOpen, onClose, knowledgeGraph }) => {
    if (!isOpen) return null;

    const items = Object.values(knowledgeGraph);
    const mastered = items.filter(i => i.status === 'mastered');
    const struggling = items.filter(i => i.status === 'struggling');
    const reviewing = items.filter(i => i.status === 'reviewing' || i.status === 'new');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                        🧠 Your Brain Map
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        ✕
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    {items.length === 0 && (
                        <p className="text-center text-slate-500 italic">Start learning to populate your brain map!</p>
                    )}

                    {struggling.length > 0 && (
                        <div>
                            <h3 className="text-red-500 font-bold mb-3 uppercase text-sm tracking-wider">Needs Focus 🚨</h3>
                            <div className="flex flex-wrap gap-2">
                                {struggling.map(item => (
                                    <span key={item.id} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium border border-red-200 dark:border-red-800">
                                        {item.id}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {reviewing.length > 0 && (
                        <div>
                            <h3 className="text-blue-500 font-bold mb-3 uppercase text-sm tracking-wider">In Progress 🔄</h3>
                            <div className="flex flex-wrap gap-2">
                                {reviewing.map(item => (
                                    <span key={item.id} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-800">
                                        {item.id}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {mastered.length > 0 && (
                        <div>
                            <h3 className="text-green-500 font-bold mb-3 uppercase text-sm tracking-wider">Mastered ✅</h3>
                            <div className="flex flex-wrap gap-2">
                                {mastered.map(item => (
                                    <span key={item.id} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium border border-green-200 dark:border-green-800">
                                        {item.id}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KnowledgeModal;
