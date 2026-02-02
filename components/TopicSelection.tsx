
import React, { useState, useRef } from 'react';
import type { Topic, HistoryItem } from '../types';
import { Difficulty } from '../types';

interface TopicSelectionProps {
  topics: Topic[];
  history: HistoryItem[];
  onSelectTopic: (topic: Topic, difficulty: Difficulty) => void;
  onSelectCustomTopic: (topicTitle: string, difficulty: Difficulty) => void;
  onSelectFile: (file: File, difficulty: Difficulty) => void;
  onRecall: (item: HistoryItem) => void;
  prefilledTopic?: string;
}

const Divider: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex items-center my-6">
        <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
        <span className="flex-shrink mx-4 text-slate-500 dark:text-slate-400 font-semibold uppercase text-sm tracking-wider">{text}</span>
        <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
    </div>
);

const TopicSelection: React.FC<TopicSelectionProps> = ({ topics, history, onSelectTopic, onSelectCustomTopic, onSelectFile, onRecall, prefilledTopic }) => {
  const [customTopic, setCustomTopic] = useState(prefilledTopic || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.HIGH_SCHOOL);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      // Clear custom topic when file is selected
      setCustomTopic('');
    }
  };

  const handleCustomTopicSubmit = () => {
      if (customTopic.trim()) {
          onSelectCustomTopic(customTopic.trim(), difficulty);
      }
  }

  const handleFileSubmit = () => {
      if (selectedFile) {
          onSelectFile(selectedFile, difficulty);
      }
  }

  const difficultyLevels = [
    { id: Difficulty.ELEMENTARY, label: 'Elementary' },
    { id: Difficulty.HIGH_SCHOOL, label: 'High School' },
    { id: Difficulty.COLLEGE, label: 'College' },
    { id: Difficulty.POST_GRADUATE, label: 'Post-Grad' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-4">Create a New Lesson</h2>
      
      {/* Difficulty Selector */}
      <div className="mb-6">
        <label className="block text-lg font-bold text-slate-700 dark:text-slate-300 mb-3 text-center">
            Choose a difficulty level
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded-xl">
            {difficultyLevels.map((level) => (
                <button
                    key={level.id}
                    onClick={() => setDifficulty(level.id)}
                    className={`w-full font-bold py-2 px-2 rounded-lg transition-colors text-sm capitalize ${
                        difficulty === level.id 
                        ? 'bg-blue-500 text-white shadow' 
                        : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                    {level.label}
                </button>
            ))}
        </div>
      </div>

      {/* Custom Topic Input */}
      <div>
        <label htmlFor="custom-topic" className="block text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
          Create a lesson on any topic
        </label>
        <div className="flex gap-2">
          <input
            id="custom-topic"
            type="text"
            value={customTopic}
            onChange={(e) => {
                setCustomTopic(e.target.value);
                // Clear file selection when typing custom topic
                setSelectedFile(null);
                if(fileInputRef.current) fileInputRef.current.value = '';
            }}
            placeholder="e.g., 'The Italian Renaissance'"
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white dark:bg-slate-800"
          />
          <button
            onClick={handleCustomTopicSubmit}
            disabled={!customTopic.trim()}
            className="bg-blue-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-600 transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            Go
          </button>
        </div>
      </div>
      
      <Divider text="OR" />
      
      {/* File Upload */}
      <div>
        <p className="block text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Generate from your own curriculum</p>
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".txt,.md"
        />
        <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 font-bold py-4 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors"
        >
            {selectedFile ? `Selected: ${selectedFile.name}` : "Upload a .txt or .md file"}
        </button>
         {selectedFile && (
             <button
                onClick={handleFileSubmit}
                className="w-full mt-3 bg-green-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-600 transition-colors"
            >
                Generate from File
            </button>
         )}
      </div>

      <Divider text="OR" />

      {/* Predefined Topics */}
      <div>
        <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-4 text-center">Choose a quick start topic</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {topics.map((topic) => (
            <button
                key={topic.title}
                onClick={() => onSelectTopic(topic, difficulty)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl text-white font-bold text-lg shadow-md hover:scale-105 hover:shadow-xl transition-transform duration-200 ease-in-out ${topic.color}`}
            >
                <span className="text-4xl mb-2">{topic.emoji}</span>
                <span className="text-center">{topic.title}</span>
            </button>
            ))}
        </div>
      </div>

      {history.length > 0 && (
        <>
            <Divider text="LESSON HISTORY" />
            <div className="flex flex-col gap-3">
                {history.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onRecall(item)}
                        className="w-full text-left p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-blue-400 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <span className={`text-xs font-bold uppercase py-1 px-2 rounded-full ${item.type === 'curriculum' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'}`}>
                                    {item.type}
                                </span>
                                <p className="font-bold text-slate-800 dark:text-slate-200 text-lg mt-1">{item.title}</p>
                            </div>
                            <div className="text-right text-slate-500 dark:text-slate-400 text-sm flex-shrink-0 ml-2">
                                <p>{new Date(item.timestamp).toLocaleDateString()}</p>
                                <p>{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </>
      )}
    </div>
  );
};

export default TopicSelection;