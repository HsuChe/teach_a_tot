
import React, { useState, useEffect } from 'react';
import type { ArticleData, Source, FeedItem } from '../types';
import { Difficulty } from '../types';
import { generateArticleStream } from '../services/geminiService';
import MarkdownRenderer from './MarkdownRenderer';

interface ArticleViewProps {
  topic: FeedItem;
  onCreateLesson: (articleData: ArticleData, topicTitle: string, difficulty: Difficulty) => void;
  onBack: () => void;
}

const InfoSection: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div>
        <h3 className="flex items-center text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
            <span className="text-xl mr-2">{icon}</span>
            {title}
        </h3>
        <div className="text-slate-600 dark:text-slate-400 text-sm space-y-2">
            {children}
        </div>
    </div>
);

const ArticleView: React.FC<ArticleViewProps> = ({ topic, onCreateLesson, onBack }) => {
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.HIGH_SCHOOL);
  const [streamedContent, setStreamedContent] = useState('');
  const [metadata, setMetadata] = useState<Omit<ArticleData, 'content'> | null>(null);
  const [status, setStatus] = useState<'streaming' | 'finalizing' | 'done' | 'error'>('streaming');
  const [error, setError] = useState<string | null>(null);

  const difficultyLevels = [
    { id: Difficulty.ELEMENTARY, label: 'Elementary' },
    { id: Difficulty.HIGH_SCHOOL, label: 'High School' },
    { id: Difficulty.COLLEGE, label: 'College' },
    { id: Difficulty.POST_GRADUATE, label: 'Post-Grad' },
  ];

  useEffect(() => {
    const streamArticle = async () => {
      setStatus('streaming');
      setStreamedContent('');
      setMetadata(null);
      setError(null);
      
      try {
        const streamResult = await generateArticleStream(topic.title, topic.summary);
        let contentBuffer = '';
        let jsonBuffer = '';
        let jsonStarted = false;
        const separator = '|||JSON_SEPARATOR|||';
        let sources: Source[] | null = null;

        for await (const chunk of streamResult) {
          const chunkText = chunk.text;
          
          if (!sources) {
            const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (groundingChunks) {
                sources = groundingChunks
                    .map((chunk: any) => chunk.web)
                    .filter((web: any): web is Source => !!web && !!web.uri && !!web.title);
            }
          }

          if (jsonStarted) {
            jsonBuffer += chunkText;
          } else {
            if (chunkText.includes(separator)) {
              const parts = chunkText.split(separator);
              contentBuffer += parts[0];
              jsonBuffer += parts[1] || '';
              jsonStarted = true;
              setStatus('finalizing');
            } else {
              contentBuffer += chunkText;
            }
          }
          setStreamedContent(contentBuffer);
        }

        let jsonText = jsonBuffer.trim();
        
        // The model can wrap the JSON in markdown code blocks.
        const markdownMatch = /```(?:json)?\n([\s\S]*?)\n```/.exec(jsonText);
        if (markdownMatch && markdownMatch[1]) {
            jsonText = markdownMatch[1].trim();
        } else {
            // If not in a markdown block, find the first and last brace.
            const firstBrace = jsonText.indexOf('{');
            const lastBrace = jsonText.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace > firstBrace) {
                jsonText = jsonText.substring(firstBrace, lastBrace + 1);
            }
        }

        const parsedMetadata = JSON.parse(jsonText);
        if (sources && sources.length > 0) {
            parsedMetadata.sources = sources;
        }

        setMetadata(parsedMetadata);
        setStatus('done');
      } catch (err) {
        console.error("Article streaming error:", err);
        setError(err instanceof Error ? err.message : 'Failed to generate the article. Please try again.');
        setStatus('error');
      }
    };

    streamArticle();
  }, [topic.title, topic.summary]);

  const handleCreateLesson = () => {
    if (status === 'done' && metadata) {
      const articleData: ArticleData = {
        content: streamedContent,
        ...metadata,
      };
      onCreateLesson(articleData, topic.title, difficulty);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg animate-fade-in">
      <header className="border-b dark:border-slate-700 pb-4 mb-4">
        <div className="text-6xl mb-3 text-center">{topic.emoji}</div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-slate-200 text-center">{topic.title}</h1>
        <p className="mt-2 text-center text-lg text-slate-500 dark:text-slate-400">{topic.summary}</p>
      </header>
      
      {metadata && (
        <div className="space-y-6 border-b dark:border-slate-700 pb-6 mb-6">
            <InfoSection title="AI-Generated Summary" icon="📝">
                <p>{metadata.summary}</p>
            </InfoSection>

            <InfoSection title="Key Points" icon="🔑">
                <ul className="list-disc list-inside space-y-1.5">
                    {metadata.keyPoints.map((point, index) => (
                        <li key={index}>{point}</li>
                    ))}
                </ul>
            </InfoSection>

            <InfoSection title="Bias Analysis" icon="🧐">
                <p>{metadata.biasAnalysis}</p>
            </InfoSection>
        </div>
      )}

      <article className="mb-8 min-h-[200px]">
        <MarkdownRenderer content={streamedContent} />
        {status === 'streaming' && !streamedContent && (
             <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
            </div>
        )}
        {status === 'streaming' && streamedContent && (
             <div className="flex items-center justify-center p-4">
                <div className="h-2 w-2 bg-slate-400 rounded-full animate-pulse"></div>
            </div>
        )}
      </article>

      {status === 'error' && (
          <div className="p-4 text-center text-red-500 bg-red-50 dark:bg-red-900/50 rounded-lg">{error}</div>
      )}

      {metadata?.sources && metadata.sources.length > 0 && (
          <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Sources</h3>
              <ul className="list-disc list-inside space-y-1">
                  {metadata.sources.map((source, index) => (
                      <li key={index} className="text-sm text-slate-600 dark:text-slate-400">
                          <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                              {source.title}
                          </a>
                      </li>
                  ))}
              </ul>
          </div>
      )}

      {status === 'done' && (
        <footer className="mt-8 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-center mb-4 text-slate-800 dark:text-slate-200">Ready to master this topic?</h2>
            <div className="mb-6">
                <label className="block text-lg font-bold text-slate-700 dark:text-slate-300 mb-3 text-center">
                    First, choose a difficulty level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-200 dark:bg-slate-700 p-1.5 rounded-xl">
                    {difficultyLevels.map((level) => (
                        <button
                            key={level.id}
                            onClick={() => setDifficulty(level.id)}
                            className={`w-full font-bold py-2 px-2 rounded-lg transition-colors text-sm capitalize ${
                                difficulty === level.id 
                                ? 'bg-blue-500 text-white shadow' 
                                : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                            }`}
                        >
                            {level.label}
                        </button>
                    ))}
                </div>
            </div>
            <button
                onClick={handleCreateLesson}
                className="w-full bg-green-500 text-white font-bold py-4 px-6 rounded-xl text-xl hover:bg-green-600 transition-colors"
            >
                Create Lesson from this Article
            </button>
        </footer>
      )}
    </div>
  );
};

export default ArticleView;
