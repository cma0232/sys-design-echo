export type LLMProvider = 'anthropic' | 'openai' | 'google';

export interface APIKeys {
  anthropic?: string;
  openai?: string;
  google?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface InterviewState {
  isActive: boolean;
  isPaused: boolean;
  timeRemaining: number; // in seconds
  selectedTopic: string;
  messages: Message[];
}

export interface Feedback {
  scalability: {
    score: number; // 1-5
    feedback: string;
  };
  tradeoffs: {
    score: number; // 1-5
    feedback: string;
  };
  communication: {
    score: number; // 1-5
    feedback: string;
  };
  overallFeedback: string;
}

export const SYSTEM_DESIGN_TOPICS = [
  'Design Twitter',
  'Design URL Shortener',
  'Design Instagram',
  'Design Uber',
  'Design Netflix',
  'Design YouTube',
  'Design Messenger',
  'Design Dropbox',
  'Design Web Crawler',
  'Design Rate Limiter',
] as const;

export type SystemDesignTopic = typeof SYSTEM_DESIGN_TOPICS[number];
