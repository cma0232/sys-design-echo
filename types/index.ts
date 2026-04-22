export type LLMProvider = 'anthropic' | 'openai' | 'google';

export interface APIKeys {
  anthropic?: string;
  openai?: string;
  google?: string;
}

export interface ModelOption {
  id: string;
  label: string;
  description: string;
}

export const PROVIDER_MODELS: Record<LLMProvider, ModelOption[]> = {
  anthropic: [
    { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', description: 'Recommended — balanced speed & quality' },
    { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', description: 'Most capable' },
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', description: 'Fastest & cheapest' },
  ],
  openai: [
    { id: 'gpt-4o', label: 'GPT-4o', description: 'Recommended — best overall' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Faster & cheaper' },
  ],
  google: [
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Most capable' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', description: 'Recommended — fast & free tier friendly' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', description: 'Lightest & cheapest' },
  ],
};

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
