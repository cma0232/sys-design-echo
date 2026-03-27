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
  timeRemaining: number;
  selectedTopic: string;
  messages: Message[];
}

export interface Feedback {
  problemFraming: {
    score: number; // 1-4
    feedback: string;
  };
  architectureDesign: {
    score: number;
    feedback: string;
  };
  tradeoffDiscussion: {
    score: number;
    feedback: string;
  };
  communicationDrive: {
    score: number;
    feedback: string;
  };
  overallFeedback: string;
}

export const FRONTEND_SD_TOPICS = [
  'Design a Social Feed (Twitter/LinkedIn-style)',
  'Design a Typeahead / Autocomplete',
  'Design a Kanban Board',
  'Design a Real-time Collaborative Editor',
  'Design an Infinite Scroll List',
  'Design a Dashboard with Real-time Updates',
  'Design an Offline-capable Web App',
  'Design a Drag-and-Drop Interface',
] as const;

export type FrontendSDTopic = typeof FRONTEND_SD_TOPICS[number];
