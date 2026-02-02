
import type { Topic } from './types';

export const INITIAL_HEARTS = 5;
export const NUM_QUESTIONS = 7;

export const topics: Topic[] = [
  { title: 'Algebra Basics', emoji: '📐', color: 'bg-blue-500' },
  { title: 'JavaScript Fundamentals', emoji: '📜', color: 'bg-yellow-500' },
  { title: 'Intro to Geometry', emoji: '🔷', color: 'bg-green-500' },
  { title: 'Solar System Facts', emoji: '🪐', color: 'bg-indigo-500' },
  { title: 'Famous Paintings', emoji: '🎨', color: 'bg-red-500' },
  { title: 'Calculus Concepts', emoji: '📈', color: 'bg-purple-500' },
];

export const EXPLORE_TOPICS = [
  'Current Events', 
  'Technology', 
  'Science', 
  'Pop Culture', 
  'Gaming', 
  'History', 
  'AI', 
  'Philosophy'
];
