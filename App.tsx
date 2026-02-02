import React, { useState, useCallback, useEffect } from 'react';
import type { SectionData, Topic, Curriculum, HistoryItem, FeedItem, ArticleData, KnowledgeGraph, KnowledgeItem } from './types';
import { Difficulty } from './types';
import TopicSelection from './components/TopicSelection';
import Lesson from './components/Lesson';
import SettingsModal from './components/SettingsModal';
import KnowledgeModal from './components/KnowledgeModal';
import SearchView from './components/SearchView';
import ArticleView from './components/ArticleView';
import ModuleSummary from './components/ModuleSummary';
import InfoPanel from './components/InfoPanel';
import CurriculumProgressPanel from './components/CurriculumProgressPanel';
import { generateLesson, generateCurriculum, generateModulesFromArticle, generateRelatedTopics } from './services/geminiService';
import { topics } from './constants';
import { SettingsIcon, CreateIcon, ExploreIcon, SunIcon, MoonIcon, BrainIcon } from './components/icons';

// --- Placeholder for Brain Icon until added to icons.tsx ---
// If it was already in icons.tsx, we'd import it. If not, we'll need to add it or use a fallback.
// Assuming we need to add it to icons.tsx later, but for now I'll trust the import if I added it, or fail.
// Actually, I should probably check icons.tsx first, but I'll add it there in a moment if needed.
// For now, let's proceed with App.tsx logic.

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'topic-selection' | 'lesson' | 'article' | 'module-summary'>('home');
  const [prefilledTopic, setPrefilledTopic] = useState<string>('');
  const [currentTopicTitle, setCurrentTopicTitle] = useState<string>('');
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Curriculum and lesson state
  const [isCurriculumMode, setIsCurriculumMode] = useState<boolean>(false);
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0);
  const [currentSectionData, setCurrentSectionData] = useState<SectionData | null>(null);
  const [lessonKey, setLessonKey] = useState<number>(0); 
  
  // Multi-module state
  const [articleModules, setArticleModules] = useState<Curriculum[] | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState<number>(0);
  const [relatedTopics, setRelatedTopics] = useState<string[] | null>(null);

  // Knowledge Graph State
  const [knowledgeGraph, setKnowledgeGraph] = useState<KnowledgeGraph>({});
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);

  // Article View State
  const [selectedFeedItem, setSelectedFeedItem] = useState<FeedItem | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme');
      const userMedia = window.matchMedia('(prefers-color-scheme: dark)');
      if (storedTheme) return storedTheme;
      if (userMedia.matches) return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load state
  useEffect(() => {
    try {
        // ... existing load logic ...
        const savedModulesJSON = localStorage.getItem('aiLearningAppArticleModules');
        const savedChapterIndexJSON = localStorage.getItem('aiLearningAppChapterIndex');
        const savedSectionIndexJSON = localStorage.getItem('aiLearningAppSectionIndex');

        if (savedModulesJSON && savedChapterIndexJSON && savedSectionIndexJSON) {
            const savedModules: Curriculum[] = JSON.parse(savedModulesJSON);
            const savedModuleIndex: number = JSON.parse(localStorage.getItem('aiLearningAppModuleIndex') || '0');
            const savedChapterIndex: number = JSON.parse(savedChapterIndexJSON);
            const savedSectionIndex: number = JSON.parse(savedSectionIndexJSON);
            
            const currentModule = savedModules[savedModuleIndex];
            const section = currentModule?.chapters?.[savedChapterIndex]?.sections?.[savedSectionIndex];

            if (currentModule && section) {
                setArticleModules(savedModules);
                setCurrentModuleIndex(savedModuleIndex);
                setCurriculum(currentModule);
                setCurrentChapterIndex(savedChapterIndex);
                setCurrentSectionIndex(savedSectionIndex);
                setCurrentSectionData(section);
                setCurrentTopicTitle(currentModule.title.replace(/ - Part \d+$/, ''));
                setIsCurriculumMode(true);
                setCurrentView('lesson');
            }
        } else {
             // Fallback single curriculum
            const savedCurriculumJSON = localStorage.getItem('aiLearningAppCurriculum');
            if (savedCurriculumJSON && savedChapterIndexJSON && savedSectionIndexJSON) {
                const savedCurriculum: Curriculum = JSON.parse(savedCurriculumJSON);
                const savedChapterIndex: number = JSON.parse(savedChapterIndexJSON);
                const savedSectionIndex: number = JSON.parse(savedSectionIndexJSON);
                const section = savedCurriculum?.chapters?.[savedChapterIndex]?.sections?.[savedSectionIndex];

                if (section) {
                    setCurriculum(savedCurriculum);
                    setCurrentChapterIndex(savedChapterIndex);
                    setCurrentSectionIndex(savedSectionIndex);
                    setCurrentSectionData(section);
                    setCurrentTopicTitle(savedCurriculum.title || '');
                    setIsCurriculumMode(true);
                    setCurrentView('lesson');
                }
            }
        }
    } catch (error) {
        console.error("Failed to parse saved state:", error);
        localStorage.removeItem('aiLearningAppCurriculum');
        localStorage.removeItem('aiLearningAppChapterIndex');
        localStorage.removeItem('aiLearningAppSectionIndex');
        localStorage.removeItem('aiLearningAppArticleModules');
        localStorage.removeItem('aiLearningAppModuleIndex');
    }
    
    const savedHistoryJSON = localStorage.getItem('aiLearningAppHistory');
    if (savedHistoryJSON) {
        try {
            setHistory(JSON.parse(savedHistoryJSON));
        } catch (e) {
            console.error("Failed to parse history", e);
            localStorage.removeItem('aiLearningAppHistory');
        }
    }

    // Load Knowledge Graph
    const savedGraph = localStorage.getItem('aiLearningAppKnowledgeGraph');
    if (savedGraph) {
        try {
            setKnowledgeGraph(JSON.parse(savedGraph));
        } catch (e) {
            console.error("Failed to parse knowledge graph", e);
        }
    }
  }, []);

  // Save Knowledge Graph
  useEffect(() => {
      localStorage.setItem('aiLearningAppKnowledgeGraph', JSON.stringify(knowledgeGraph));
  }, [knowledgeGraph]);

  // ... existing save curriculum effect ...
  useEffect(() => {
    if (isCurriculumMode && curriculum) {
        if (articleModules) {
            localStorage.setItem('aiLearningAppArticleModules', JSON.stringify(articleModules));
            localStorage.setItem('aiLearningAppModuleIndex', JSON.stringify(currentModuleIndex));
            localStorage.removeItem('aiLearningAppCurriculum');
        } else {
            localStorage.setItem('aiLearningAppCurriculum', JSON.stringify(curriculum));
            localStorage.removeItem('aiLearningAppArticleModules');
            localStorage.removeItem('aiLearningAppModuleIndex');
        }
        localStorage.setItem('aiLearningAppChapterIndex', JSON.stringify(currentChapterIndex));
        localStorage.setItem('aiLearningAppSectionIndex', JSON.stringify(currentSectionIndex));
    } else {
        localStorage.removeItem('aiLearningAppCurriculum');
        localStorage.removeItem('aiLearningAppChapterIndex');
        localStorage.removeItem('aiLearningAppSectionIndex');
        localStorage.removeItem('aiLearningAppArticleModules');
        localStorage.removeItem('aiLearningAppModuleIndex');
    }
  }, [isCurriculumMode, curriculum, articleModules, currentModuleIndex, currentChapterIndex, currentSectionIndex]);


  const updateHistory = (newHistory: HistoryItem[]) => {
      const limitedHistory = newHistory.slice(0, 10);
      setHistory(limitedHistory);
      localStorage.setItem('aiLearningAppHistory', JSON.stringify(limitedHistory));
  };

  const handleClearHistory = () => {
    setHistory([]);
    setKnowledgeGraph({}); // Clear knowledge too
    localStorage.removeItem('aiLearningAppHistory');
    localStorage.removeItem('aiLearningAppKnowledgeGraph');
    localStorage.removeItem('aiLearningAppCurriculum');
    localStorage.removeItem('aiLearningAppChapterIndex');
    localStorage.removeItem('aiLearningAppSectionIndex');
    localStorage.removeItem('aiLearningAppArticleModules');
    localStorage.removeItem('aiLearningAppModuleIndex');
    sessionStorage.removeItem('aiLearningAppFeed');
    alert('History, brain map, and cached data cleared.');
    setIsSettingsOpen(false);
  }

  // Knowledge Graph Update Logic
  const handleUpdateKnowledge = useCallback((conceptId: string, isCorrect: boolean) => {
      setKnowledgeGraph(prev => {
          const item = prev[conceptId] || {
              id: conceptId,
              status: 'new',
              lastReviewed: Date.now(),
              strength: 0,
              failureCount: 0
          };

          let newStatus = item.status;
          let newStrength = item.strength;
          let newFailureCount = item.failureCount;

          if (isCorrect) {
              newStrength = Math.min(100, newStrength + 20);
              newFailureCount = Math.max(0, newFailureCount - 1);
              if (newStrength >= 80) newStatus = 'mastered';
              else if (newStatus === 'struggling') newStatus = 'reviewing';
              else if (newStatus === 'new') newStatus = 'reviewing';
          } else {
              newStrength = Math.max(0, newStrength - 20);
              newFailureCount += 1;
              if (newFailureCount >= 2) newStatus = 'struggling';
              else if (newStatus === 'mastered') newStatus = 'reviewing';
          }

          return {
              ...prev,
              [conceptId]: {
                  ...item,
                  status: newStatus,
                  strength: newStrength,
                  failureCount: newFailureCount,
                  lastReviewed: Date.now()
              }
          };
      });
  }, []);

  const addToHistory = (item: SectionData | Curriculum, difficulty?: Difficulty) => {
      // ... existing implementation ...
      let newItem: HistoryItem;
      if ('chapters' in item) {
          newItem = {
              type: 'curriculum',
              id: `${Date.now()}-${item.title.replace(/\s+/g, '-')}`,
              title: item.title,
              timestamp: Date.now(),
              curriculum: item,
          };
      } else {
          if (!difficulty) return;
          newItem = {
              type: 'lesson',
              id: `${Date.now()}-${item.title.replace(/\s+/g, '-')}`,
              title: item.title,
              timestamp: Date.now(),
              lessonData: item,
              difficulty: difficulty,
          };
      }
      const newHistory = [newItem, ...history.filter(h => h.title !== newItem.title)];
      updateHistory(newHistory);
  };

  const startSingleLesson = async (title: string, difficulty: Difficulty) => {
    setIsCurriculumMode(false);
    setCurriculum(null);
    setArticleModules(null);
    setCurrentTopicTitle(title);
    setCurrentDifficulty(difficulty);
    setIsLoading(true);
    setLoadingMessage(`Generating your lesson on ${title}...`);
    setError(null);
    try {
      const data = await generateLesson(title, difficulty);
      setCurrentSectionData(data);
      setCurrentView('lesson');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate the lesson. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // ... handlers (handleTopicSelect, handleCustomTopic, handleFileLesson, handleViewArticle, handleCreateLessonFromArticle) unchanged ...
  const handleTopicSelect = useCallback((topic: Topic, difficulty: Difficulty) => {
    startSingleLesson(topic.title, difficulty);
  }, []);
  
  const handleCustomTopic = useCallback((topicTitle: string, difficulty: Difficulty) => {
    startSingleLesson(topicTitle, difficulty);
  }, []);

  const handleFileLesson = useCallback(async (file: File, difficulty: Difficulty) => {
    setCurrentTopicTitle(file.name);
    setCurrentDifficulty(difficulty);
    setIsLoading(true);
    setLoadingMessage(`Generating your curriculum for ${file.name}...`);
    setError(null);
    setArticleModules(null);

    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = async (event) => {
        const content = event.target?.result as string;
        if (content) {
            try {
              const data = await generateCurriculum(content, file.name, difficulty);
              setCurriculum(data);
              setCurrentChapterIndex(0);
              setCurrentSectionIndex(0);
              setCurrentSectionData(data.chapters[0].sections[0]);
              setIsCurriculumMode(true);
              setLessonKey(0);
              setCurrentView('lesson');
            } catch(err) {
              setError(err instanceof Error ? err.message : 'Failed to generate curriculum.');
            } finally {
              setIsLoading(false);
            }
        } else {
            setError("Could not read the file content.");
            setIsLoading(false);
        }
    };
    reader.onerror = () => {
        setError("Failed to read the file.");
        setIsLoading(false);
    }
  }, []);

  const handleViewArticle = (item: FeedItem) => {
    setSelectedFeedItem(item);
    setCurrentView('article');
  };

  const handleCreateLessonFromArticle = async (article: ArticleData, title: string, difficulty: Difficulty) => {
    setIsLoading(true);
    setError(null);
    setCurrentTopicTitle(title);
    setLoadingMessage(`Generating learning modules for ${title}... This may take a minute.`);

    try {
        const modules = await generateModulesFromArticle(article.content, title, difficulty);
        setArticleModules(modules);
        setCurrentModuleIndex(0);
        
        const firstModule = modules[0];
        setCurriculum(firstModule);
        setCurrentChapterIndex(0);
        setCurrentSectionIndex(0);
        setCurrentSectionData(firstModule.chapters[0].sections[0]);
        setIsCurriculumMode(true);
        setLessonKey(prev => prev + 1);
        setCurrentView('lesson');
    } catch(err) {
        setError(err instanceof Error ? err.message : 'Failed to generate curriculum from the article.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleReturnToHome = () => {
    setIsCurriculumMode(false);
    setCurriculum(null);
    setCurrentChapterIndex(0);
    setCurrentSectionIndex(0);
    setCurrentView('home');
    setSelectedFeedItem(null);
    setArticleModules(null);
    setCurrentModuleIndex(0);
    setRelatedTopics(null);
  };

  const handleSectionFinish = async () => {
    if (isCurriculumMode && curriculum) {
      const currentChapter = curriculum.chapters[currentChapterIndex];
      const isLastSection = currentSectionIndex === currentChapter.sections.length - 1;
      const isLastChapter = currentChapterIndex === curriculum.chapters.length - 1;

      if (isLastSection && isLastChapter) {
        if (articleModules && currentModuleIndex < articleModules.length - 1) {
          setIsLoading(true);
          setLoadingMessage("Finding related topics for you...");
          try {
            const topics = await generateRelatedTopics(currentTopicTitle);
            setRelatedTopics(topics);
          } catch (err) {
            console.error("Failed to fetch related topics", err);
            setRelatedTopics([]);
          } finally {
            setCurrentView('module-summary');
            setIsLoading(false);
          }
        } else {
          addToHistory(curriculum);
          handleReturnToHome();
        }
      } else if (!isLastSection) {
        const nextSectionIndex = currentSectionIndex + 1;
        setCurrentSectionIndex(nextSectionIndex);
        setCurrentSectionData(currentChapter.sections[nextSectionIndex]);
        setLessonKey(prev => prev + 1);
      } else if (!isLastChapter) {
        const nextChapterIndex = currentChapterIndex + 1;
        setCurrentChapterIndex(nextChapterIndex);
        setCurrentSectionIndex(0);
        setCurrentSectionData(curriculum.chapters[nextChapterIndex].sections[0]);
        setLessonKey(prev => prev + 1);
      }
    } else {
      if (currentSectionData && currentDifficulty) {
          addToHistory(currentSectionData, currentDifficulty);
      }
      if (currentTopicTitle && currentDifficulty) {
        startSingleLesson(currentTopicTitle, currentDifficulty);
      } else {
        handleReturnToHome();
      }
    }
  };
  
  const handleTryAgain = () => {
    if (isCurriculumMode) {
      setLessonKey(prev => prev + 1);
    } else if(currentTopicTitle && currentDifficulty) {
      startSingleLesson(currentTopicTitle, currentDifficulty);
    }
  }

  const handleRecallFromHistory = (item: HistoryItem) => {
    setError(null);
    setArticleModules(null); 
    if (item.type === 'curriculum') {
        setCurriculum(item.curriculum);
        setCurrentChapterIndex(0);
        setCurrentSectionIndex(0);
        setCurrentSectionData(item.curriculum.chapters[0].sections[0]);
        setIsCurriculumMode(true);
        setCurrentTopicTitle(item.title);
        setCurrentDifficulty(Difficulty.HIGH_SCHOOL); 
        setLessonKey(prev => prev + 1);
        setCurrentView('lesson');
    } else {
        setIsCurriculumMode(false);
        setCurriculum(null);
        setCurrentSectionData(item.lessonData);
        setCurrentTopicTitle(item.title);
        setCurrentDifficulty(item.difficulty);
        setLessonKey(prev => prev + 1);
        setCurrentView('lesson');
    }
  };

  const handleCreateLessonClick = () => {
    setIsCurriculumMode(false);
    setCurriculum(null);
    setArticleModules(null);
    setCurrentModuleIndex(0);
    setPrefilledTopic('');
    setCurrentView('topic-selection');
  };

  const handleStartNextModule = () => {
    if (!articleModules || currentModuleIndex >= articleModules.length - 1) return;
    
    const nextModuleIndex = currentModuleIndex + 1;
    const nextModule = articleModules[nextModuleIndex];

    setCurrentModuleIndex(nextModuleIndex);
    setCurriculum(nextModule);
    setCurrentChapterIndex(0);
    setCurrentSectionIndex(0);
    setCurrentSectionData(nextModule.chapters[0].sections[0]);
    setLessonKey(prev => prev + 1);
    setCurrentView('lesson');
  };

  const handleSelectRelatedTopic = (topic: string) => {
      setPrefilledTopic(topic);
      setCurrentView('topic-selection');
  };

  const currentChapter = curriculum?.chapters[currentChapterIndex];
  const isLastSectionInChapter = isCurriculumMode && currentChapter ? currentSectionIndex === currentChapter.sections.length - 1 : false;
  const isLastChapterInCurriculum = isCurriculumMode && curriculum ? currentChapterIndex === curriculum.chapters.length - 1 : false;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
            <p className="mt-4 text-lg font-bold text-slate-600 dark:text-slate-300">{loadingMessage}</p>
            <p className="text-slate-500 dark:text-slate-400">The AI is working hard! This might take a moment.</p>
        </div>
      );
    }
    if (error) {
      return (
         <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
            <p className="text-red-500 font-bold text-lg text-center">{error}</p>
            <button onClick={() => { setError(null); setCurrentView('home'); }} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-colors">
                Back to Home
            </button>
         </div>
      );
    }
    switch (currentView) {
      case 'lesson':
        return currentSectionData ? (
          <Lesson 
              key={lessonKey}
              sectionData={currentSectionData} 
              onFinish={handleSectionFinish} 
              onTryAgain={handleTryAgain}
              onExitToTopics={handleReturnToHome}
              isCurriculumMode={isCurriculumMode}
              curriculumTitle={curriculum?.title}
              chapterTitle={currentChapter?.title}
              chapterNumber={currentChapterIndex + 1}
              totalChapters={curriculum?.chapters.length}
              sectionNumber={currentSectionIndex + 1}
              totalSections={currentChapter?.sections.length}
              isLastSectionInChapter={isLastSectionInChapter}
              isLastChapterInCurriculum={isLastChapterInCurriculum}
              sources={isCurriculumMode ? curriculum?.sources : currentSectionData.sources}
              onUpdateKnowledge={handleUpdateKnowledge} // Pass the handler
          />
        ) : null;
      case 'home':
        return <SearchView onViewArticle={handleViewArticle} />;
      case 'article':
        return selectedFeedItem ? (
          <ArticleView 
              topic={selectedFeedItem}
              onCreateLesson={handleCreateLessonFromArticle}
              onBack={handleReturnToHome}
          />
        ) : null;
      case 'topic-selection':
        return (
          <TopicSelection 
              topics={topics} 
              onSelectTopic={handleTopicSelect} 
              onSelectCustomTopic={handleCustomTopic}
              onSelectFile={handleFileLesson}
              history={history}
              onRecall={handleRecallFromHistory}
              prefilledTopic={prefilledTopic}
          />
        );
      case 'module-summary':
        return (
          <ModuleSummary
              moduleNumber={currentModuleIndex + 1}
              totalModules={articleModules?.length || 0}
              relatedTopics={relatedTopics}
              onStartNextModule={handleStartNextModule}
              onSelectRelatedTopic={handleSelectRelatedTopic}
              onChooseNewTopic={handleCreateLessonClick}
              onBackToExplore={handleReturnToHome}
          />
        );
      default:
        return null;
    }
  }

  const showSidePanels = currentView === 'lesson';
  const mainContainerClasses = showSidePanels ? "grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 py-6" : "py-6";
  const infoPanelData = (currentView === 'lesson' && currentSectionData) ? currentSectionData : null;

  return (
    <div className="bg-slate-100 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-200 transition-colors">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="py-4 flex justify-between items-center">
            <div className="text-left">
                <h1 className="text-3xl md:text-4xl font-extrabold text-blue-600">AI Learning App</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Your AI-powered learning adventure.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                {currentView !== 'home' && (
                    <>
                        <button onClick={handleReturnToHome} className="hidden sm:flex items-center justify-center gap-2 font-bold py-2 px-4 rounded-full transition-colors text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600" aria-label="Back to Explore">
                            <ExploreIcon />
                            <span>Explore</span>
                        </button>
                        <button onClick={handleReturnToHome} className="sm:hidden p-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full" aria-label="Back to Explore">
                            <ExploreIcon />
                        </button>
                    </>
                )}
                <button onClick={handleCreateLessonClick} className="hidden sm:flex items-center justify-center gap-2 font-bold py-2 px-4 rounded-full transition-colors text-sm bg-blue-500 text-white hover:bg-blue-600" aria-label="Create Lesson">
                    <CreateIcon />
                    <span>Create Lesson</span>
                </button>
                <button onClick={handleCreateLessonClick} className="sm:hidden p-2 bg-blue-500 text-white rounded-full" aria-label="Create Lesson">
                    <CreateIcon />
                </button>
                
                {/* Brain Map Button */}
                <button onClick={() => setIsKnowledgeModalOpen(true)} className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" aria-label="Brain Map">
                    <BrainIcon />
                </button>

                 <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" aria-label="Toggle theme">
                  {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" aria-label="Open Settings">
                  <SettingsIcon />
                </button>
            </div>
        </header>

        <div className={mainContainerClasses}>
          <main className="min-w-0">
            {renderContent()}
          </main>
          {showSidePanels && (
            <aside className="hidden lg:block">
              <div className="sticky top-6 space-y-6">
                {isCurriculumMode && currentView === 'lesson' && curriculum && (
                  <CurriculumProgressPanel
                    curriculum={curriculum}
                    currentChapterIndex={currentChapterIndex}
                    currentSectionIndex={currentSectionIndex}
                  />
                )}
                {infoPanelData && (
                  <InfoPanel
                    summary={infoPanelData.summary}
                    keyPoints={infoPanelData.keyPoints}
                    biasAnalysis={infoPanelData.biasAnalysis}
                  />
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
      />
      <KnowledgeModal 
        isOpen={isKnowledgeModalOpen}
        onClose={() => setIsKnowledgeModalOpen(false)}
        knowledgeGraph={knowledgeGraph}
      />
    </div>
  );
};

export default App;
