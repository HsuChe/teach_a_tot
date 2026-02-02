// --- ENUMS ---

export enum Difficulty {
  ELEMENTARY = 'elementary school',
  HIGH_SCHOOL = 'high school',
  COLLEGE = 'college',
  POST_GRADUATE = 'post-graduate',
}

export enum QuestionType {
    MULTIPLE_CHOICE = 'multiple-choice',
    FILL_IN_THE_BLANK = 'fill-in-the-blank',
    MATH_INTERACTION = 'math-interaction',
}

export enum MathInteractionType {
    CALCULATION_PAD = 'calculation-pad',
    EQUATION_BALANCER = 'equation-balancer',
    GRAPHING_CANVAS = 'graphing-canvas',
    GEOMETRIC_SANDBOX = 'geometric-sandbox',
    CALCULUS_VISUALIZER = 'calculus-visualizer',
}


// --- DATA STRUCTURES ---

export interface Topic {
  title: string;
  emoji: string;
  color: string;
}

export interface Source {
  uri: string;
  title: string;
}

export interface LearningSlide {
    title: string;
    content: string;
    visualAidDescription?: string;
}

export interface TeachingPrompt {
    promptText: string;
    relatedSlideIndex: number;
}

export interface MathInitialState {
    expression?: string;
    leftSide?: string;
    rightSide?: string;
    equation?: string;
    prompt?: string;
    geometricTask?: 'MEASURE_ANGLE' | 'CONSTRUCT_SHAPE' | 'TRANSFORM_SHAPE';
    initialObjects?: any[];
    calculusTask?: 'DERIVATIVE' | 'INTEGRAL' | 'LIMIT';
    functionString?: string;
    integralRange?: [number, number];
    limitPoint?: number;
}

export interface Question {
    title?: string;
    questionText: string;
    questionType: QuestionType;
    interactionType?: MathInteractionType;
    initialState?: MathInitialState;
    options?: { text: string; definition: string; }[];
    correctAnswer: string;
    explanation: string;
    relatedSlideIndex: number;
}

export interface SectionData {
    title: string;
    summary?: string;
    keyPoints?: string[];
    biasAnalysis?: string;
    learningMaterial: LearningSlide[];
    teachingPrompts: TeachingPrompt[];
    questions: Question[];
    sources?: Source[];
}

export interface Chapter {
    title: string;
    sections: SectionData[];
}

export interface Curriculum {
    title: string;
    summary?: string;
    keyPoints?: string[];
    biasAnalysis?: string;
    chapters: Chapter[];
    sources?: Source[];
}

export interface ArticleData {
    content: string;
    summary: string;
    keyPoints: string[];
    biasAnalysis: string;
    sources?: Source[];
}

// --- FEED & SEARCH TYPES ---

export interface FeedItem {
  title: string;
  summary: string;
  emoji: string;
  color: string; // e.g., 'bg-blue-500'
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}


// --- APP-SPECIFIC TYPES ---

export type HistoryItem = {
    id: string;
    title: string;
    timestamp: number;
} & ({
    type: 'curriculum';
    curriculum: Curriculum;
} | {
    type: 'lesson';
    lessonData: SectionData;
    difficulty: Difficulty;
});

// --- KNOWLEDGE GRAPH ---

export type KnowledgeStatus = 'mastered' | 'reviewing' | 'struggling' | 'new';

export interface KnowledgeItem {
    id: string; // The concept name or title
    status: KnowledgeStatus;
    lastReviewed: number; // Timestamp
    strength: number; // 0-100 score
    failureCount: number;
}

export type KnowledgeGraph = Record<string, KnowledgeItem>;