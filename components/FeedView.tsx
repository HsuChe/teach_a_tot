
import React, { useState } from 'react';
import type { FeedItem } from '../types';
import ChatPopup from './ChatPopup';

// --- Sub-components for the Feed feature ---

interface FeedCardProps {
    item: FeedItem;
    onViewArticle: (item: FeedItem) => void;
}

const FeedCard: React.FC<FeedCardProps> = ({ item, onViewArticle }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);

    return (
        <>
            <div 
                className={`p-6 rounded-2xl text-white shadow-lg flex flex-col justify-between min-h-[250px] animate-fade-in-fast cursor-pointer transition-transform hover:scale-[1.02] ${item.color}`}
                onClick={() => onViewArticle(item)}
                role="button"
                tabIndex={0}
                aria-label={`View article about ${item.title}`}
            >
                <div>
                    <div className="text-5xl mb-3">{item.emoji}</div>
                    <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                    <p className="opacity-90">{item.summary}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsChatOpen(true);
                        }}
                        className="w-full sm:w-auto bg-white/20 hover:bg-white/30 backdrop-blur-sm font-bold py-3 px-4 rounded-xl transition-colors"
                    >
                        Discuss with AI
                    </button>
                </div>
            </div>
            {isChatOpen && (
                <ChatPopup 
                    topicTitle={item.title}
                    initialContext={item.summary}
                    onClose={() => setIsChatOpen(false)}
                />
            )}
        </>
    );
};


interface FeedViewProps {
    onViewArticle: (item: FeedItem) => void;
    feedItems: FeedItem[];
    isLoading: boolean;
    error: string | null;
    onRetry: () => void;
    isFetchingMore: boolean;
}

const FeedView: React.FC<FeedViewProps> = ({ onViewArticle, feedItems, isLoading, error, onRetry, isFetchingMore }) => {

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
                <p className="mt-4 text-lg font-bold text-slate-600 dark:text-slate-300">Discovering new topics...</p>
                <p className="text-slate-500 dark:text-slate-400">The AI is searching for interesting ideas!</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
                <p className="text-red-500 font-bold text-lg text-center">{error}</p>
                <button 
                    onClick={onRetry}
                    className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }
    
    return (
        <div>
            <div className="flex items-center my-6">
                <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
                <span className="flex-shrink mx-4 text-slate-500 dark:text-slate-400 font-semibold uppercase text-sm tracking-wider">Explore Topics</span>
                <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {feedItems.map((item, index) => (
                    <FeedCard key={`${item.title}-${index}`} item={item} onViewArticle={onViewArticle} />
                ))}
            </div>
            {isFetchingMore && (
                <div className="flex justify-center items-center p-6" aria-live="polite">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-500"></div>
                    <span className="sr-only">Loading more topics...</span>
                </div>
            )}
        </div>
    );
};

export default FeedView;