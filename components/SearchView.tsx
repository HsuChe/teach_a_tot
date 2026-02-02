
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateFeed, generateSingleFeedItem } from '../services/geminiService';
import type { FeedItem } from '../types';
import { SearchIcon, SettingsIcon } from './icons';
import FeedView from './FeedView';
import { EXPLORE_TOPICS } from '../constants';
import TopicSettingsModal from './TopicSettingsModal';


interface SearchViewProps {
    onViewArticle: (item: FeedItem) => void;
}

const SearchView: React.FC<SearchViewProps> = ({ onViewArticle }) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Topic selection state
    const [selectedTopics, setSelectedTopics] = useState<string[]>(['Current Events', 'Technology']);
    const [isTopicSettingsOpen, setIsTopicSettingsOpen] = useState(false);

    // Feed state
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [isFeedLoading, setIsFeedLoading] = useState(true);
    const [feedError, setFeedError] = useState<string | null>(null);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    // Search state
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const fetchFeed = useCallback(async (topics: string[]) => {
        setIsFeedLoading(true);
        setFeedError(null);
        try {
            const data = await generateFeed([], topics);
            setFeedItems(data.feedItems);
        } catch (err) {
            setFeedError(err instanceof Error ? err.message : 'Failed to generate feed.');
        } finally {
            setIsFeedLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFeed(selectedTopics);
    }, [selectedTopics, fetchFeed]);

    const fetchMoreItems = useCallback(async () => {
        if (isFetchingMore || isFeedLoading || feedItems.length === 0) return;

        setIsFetchingMore(true);
        try {
            const existingTitles = feedItems.map(item => item.title);
            const data = await generateFeed(existingTitles, selectedTopics);
            const newItems = data.feedItems.filter(newItem => !existingTitles.includes(newItem.title));
            setFeedItems(prevItems => [...prevItems, ...newItems]);
        } catch (err) {
            console.error("Failed to fetch more items:", err);
            // Optionally set a non-blocking error message for the user
        } finally {
            setIsFetchingMore(false);
        }
    }, [isFetchingMore, isFeedLoading, feedItems, selectedTopics]);

    useEffect(() => {
        const handleScroll = () => {
            const isNearBottom = window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 200;
            if (isNearBottom) {
                fetchMoreItems();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [fetchMoreItems]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setSearchError(null);
        inputRef.current?.blur();

        try {
            const newItem = await generateSingleFeedItem(query);
            setFeedItems(prevItems => [newItem, ...prevItems.filter(item => item.title !== newItem.title)]);
            setQuery('');
        } catch (err) {
            setSearchError(err instanceof Error ? err.message : 'Could not generate a topic for that search. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };
    
    const handleTopicClick = (topic: string) => {
        setSelectedTopics(prev => {
            const newTopics = new Set(prev);
            if (newTopics.has(topic)) {
                newTopics.delete(topic);
            } else {
                newTopics.add(topic);
            }
            return Array.from(newTopics);
        });
    };

    const handleSaveTopicSettings = (newTopics: string[]) => {
        setSelectedTopics(newTopics);
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSearch} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold text-center mb-4">Explore or Search Topics</h2>
                <p className="text-center text-slate-500 dark:text-slate-400 mb-4">Get AI-generated learning cards on any topic.</p>
                
                <div className="mt-6 border-t dark:border-slate-700 pt-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Categories</h3>
                        <button 
                            type="button" 
                            onClick={() => setIsTopicSettingsOpen(true)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            aria-label="Topic Settings"
                        >
                            <SettingsIcon />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {EXPLORE_TOPICS.map(topic => {
                            const isSelected = selectedTopics.includes(topic);
                            return (
                                <button
                                    type="button"
                                    key={topic}
                                    onClick={() => handleTopicClick(topic)}
                                    className={`px-3 py-1.5 rounded-full font-semibold text-sm transition-colors border ${
                                        isSelected 
                                        ? 'bg-blue-500 border-blue-500 text-white' 
                                        : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    {topic}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="mt-6 border-t dark:border-slate-700 pt-4">
                     <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="e.g., The latest advancements in AI"
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white dark:bg-slate-800"
                        />
                        <button
                            type="submit"
                            disabled={isSearching || !query.trim()}
                            className="bg-blue-500 text-white font-bold p-3 rounded-xl hover:bg-blue-600 transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center w-14"
                            aria-label="Search"
                        >
                            {isSearching ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            ) : (
                                <SearchIcon />
                            )}
                        </button>
                    </div>
                </div>

            </form>

            {searchError && (
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg text-center">
                    <p className="text-red-500 font-bold text-lg">{searchError}</p>
                 </div>
            )}
            
            <FeedView 
                onViewArticle={onViewArticle}
                feedItems={feedItems}
                isLoading={isFeedLoading}
                error={feedError}
                onRetry={() => fetchFeed(selectedTopics)}
                isFetchingMore={isFetchingMore}
            />

            <TopicSettingsModal 
                isOpen={isTopicSettingsOpen}
                onClose={() => setIsTopicSettingsOpen(false)}
                allTopics={EXPLORE_TOPICS}
                selectedTopics={selectedTopics}
                onSave={handleSaveTopicSettings}
            />
        </div>
    );
}

export default SearchView;
