import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { APIKeys, LLMProvider, Message, Feedback } from '@/types';

interface InterviewStore {
  // API Keys
  apiKeys: APIKeys;
  selectedProvider: LLMProvider;
  setAPIKey: (provider: LLMProvider, key: string) => void;
  setProvider: (provider: LLMProvider) => void;

  // Interview State
  isActive: boolean;
  isPaused: boolean;
  timeRemaining: number;
  selectedTopic: string;
  messages: Message[];

  // RAG context retrieved at interview start
  ragContext: string;
  setRagContext: (context: string) => void;

  // Camera State
  isCameraEnabled: boolean;

  // Diagram
  diagramData: any;

  // Feedback
  feedback: Feedback | null;

  // Actions
  startInterview: (topic: string) => void;
  pauseInterview: () => void;
  resumeInterview: () => void;
  endInterview: () => void;
  addMessage: (message: Message) => void;
  decrementTime: () => void;
  toggleCamera: () => void;
  setDiagramData: (data: any) => void;
  setFeedback: (feedback: Feedback) => void;
  reset: () => void;
}

const INITIAL_TIME = 30 * 60;

export const useInterviewStore = create<InterviewStore>()(
  persist(
    (set) => ({
      apiKeys: {},
      selectedProvider: 'anthropic',
      isActive: false,
      isPaused: false,
      timeRemaining: INITIAL_TIME,
      selectedTopic: '',
      messages: [],
      ragContext: '',
      isCameraEnabled: false,
      diagramData: null,
      feedback: null,

      setAPIKey: (provider, key) =>
        set((state) => ({ apiKeys: { ...state.apiKeys, [provider]: key } })),

      setProvider: (provider) => set({ selectedProvider: provider }),

      setRagContext: (context) => set({ ragContext: context }),

      startInterview: (topic) =>
        set({
          isActive: true,
          isPaused: false,
          selectedTopic: topic,
          timeRemaining: INITIAL_TIME,
          messages: [],
          ragContext: '',
          feedback: null,
        }),

      pauseInterview: () => set({ isPaused: true }),

      resumeInterview: () => set({ isPaused: false }),

      endInterview: () => set({ isActive: false, isPaused: false }),

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      decrementTime: () =>
        set((state) => ({ timeRemaining: Math.max(0, state.timeRemaining - 1) })),

      toggleCamera: () =>
        set((state) => ({ isCameraEnabled: !state.isCameraEnabled })),

      setDiagramData: (data) => set({ diagramData: data }),

      setFeedback: (feedback) => set({ feedback }),

      reset: () =>
        set({
          isActive: false,
          isPaused: false,
          timeRemaining: INITIAL_TIME,
          selectedTopic: '',
          messages: [],
          ragContext: '',
          isCameraEnabled: false,
          diagramData: null,
          feedback: null,
        }),
    }),
    {
      name: 'interview-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        apiKeys: state.apiKeys,
        selectedProvider: state.selectedProvider,
      }),
    }
  )
);
