'use client';

import { useEffect, useState, useRef } from 'react';
import { useInterviewStore } from '@/lib/store/interview-store';
import { CameraView } from '@/components/camera/camera-view';
import ExcalidrawWrapper, { exportDiagramAsImage } from '@/components/diagram/excalidraw-wrapper';
import { SpeechInterface, speakText } from '@/components/speech/speech-interface';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Pause, Play, Send } from 'lucide-react';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

export function InterviewSession() {
  const {
    apiKeys,
    selectedProvider,
    selectedModel,
    selectedTopic,
    isPaused,
    timeRemaining,
    isCameraEnabled,
    ragContext,
    setRagContext,
    pauseInterview,
    resumeInterview,
    decrementTime,
    toggleCamera,
    addMessage,
    setFeedback,
    endInterview,
  } = useInterviewStore();

  const [hasStartedInterview, setHasStartedInterview] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const setMessagesSync = (updater: Message[] | ((prev: Message[]) => Message[])) => {
    setMessages((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      messagesRef.current = next;
      return next;
    });
  };
  const [pendingTranscript, setPendingTranscript] = useState<string>('');
  const lastMessageRef = useRef<string>('');
  const hasStartedRef = useRef(false);
  const transcriptTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<Message[]>([]);

  const interruptAI = () => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel();
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setIsAISpeaking(false);
    setIsLoading(false);
  };

  // Manual function to send message and handle streaming response
  const sendMessageToAI = async (userMessage: string) => {
    interruptAI();

    console.log('📤 Sending message to AI:', userMessage);
    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Add user message to state
    const userMsg: Message = {
      role: 'user',
      content: userMessage,
      id: Date.now().toString(),
    };
    const currentMessages = messagesRef.current;
    setMessagesSync((prev) => [...prev, userMsg]);

    // Add to store
    addMessage({
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...currentMessages, userMsg].map(m => ({ role: m.role, content: m.content })),
          provider: selectedProvider,
          model: selectedModel,
          apiKey: apiKeys[selectedProvider],
          topic: selectedTopic,
          ragContext,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Read the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          aiResponse += chunk;
          console.log('📥 Received chunk:', chunk);
        }
      }

      console.log('✅ Full AI response:', aiResponse);

      // Add assistant message to state
      const assistantMsg: Message = {
        role: 'assistant',
        content: aiResponse,
        id: (Date.now() + 1).toString(),
      };
      setMessagesSync((prev) => [...prev, assistantMsg]);

      // Add to store
      addMessage({
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
      });

      // Trigger TTS
      console.log('🔊 Starting TTS...');
      setIsAISpeaking(true);
      speakText(aiResponse, () => {
        console.log('✅ TTS finished');
        setIsAISpeaking(false);
      }, apiKeys['openai']);

    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      console.error('❌ Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (transcriptTimerRef.current) {
        clearTimeout(transcriptTimerRef.current);
      }
    };
  }, []);

  // Timer
  useEffect(() => {
    if (isPaused || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      decrementTime();
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, timeRemaining, decrementTime]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && !isSubmitting) {
      handleSubmit();
    }
  }, [timeRemaining]);

  // Pause: stop TTS and mic
  useEffect(() => {
    if (isPaused) {
      window.speechSynthesis.cancel();
      setIsAISpeaking(false);
      setIsListening(false);
    }
  }, [isPaused]);

  // Start with interviewer's first question - only once, after user clicks Start
  useEffect(() => {
    if (!hasStartedInterview) return;
    if (!hasStartedRef.current && messages.length === 0) {
      hasStartedRef.current = true;
      setIsListening(true);

      // Validate API key before starting
      const currentApiKey = apiKeys[selectedProvider];
      console.log('🔑 Selected provider:', selectedProvider);
      console.log('🔑 API key exists:', !!currentApiKey);

      if (!currentApiKey) {
        console.error('❌ No API key for provider:', selectedProvider);
        alert(`Please set an API key for ${selectedProvider} before starting the interview.`);
        endInterview();
        return;
      }

      console.log('🚀 Starting interview for topic:', selectedTopic);

      (async () => {
        // Fetch RAG context before starting
        try {
          const ragRes = await fetch('/api/retrieve-context', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: selectedTopic }),
          });
          const { context } = await ragRes.json();
          if (context) {
            setRagContext(context);
            console.log('📚 RAG context loaded');
          }
        } catch (e) {
          console.warn('RAG context fetch failed, proceeding without it');
        }

        // Generate opening as assistant message so AI never needs to repeat it
        setIsLoading(true);
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', content: `Start the interview for: ${selectedTopic}` }],
              provider: selectedProvider,
              model: selectedModel,
              apiKey: apiKeys[selectedProvider],
              topic: selectedTopic,
              ragContext,
            }),
            signal: abortController.signal,
          });
          const reader = res.body?.getReader();
          const decoder = new TextDecoder();
          let opening = '';
          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              opening += decoder.decode(value, { stream: true });
            }
          }
          const assistantMsg: Message = { role: 'assistant', content: opening, id: Date.now().toString() };
          setMessagesSync([assistantMsg]);
          addMessage({ role: 'assistant', content: opening, timestamp: Date.now() });
          setIsAISpeaking(true);
          speakText(opening, () => setIsAISpeaking(false), apiKeys['openai']);
        } catch (e: any) {
          if (e?.name !== 'AbortError') console.error('Opening error:', e);
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [hasStartedInterview, messages.length, selectedTopic, apiKeys, selectedProvider, endInterview]);

  const handleTranscript = async (text: string, isFinal: boolean) => {
    if (!text) return;

    // Always reset the silence timer on any speech activity
    if (transcriptTimerRef.current) {
      clearTimeout(transcriptTimerRef.current);
    }

    // Only accumulate final results
    if (!isFinal) return;

    const newTranscript = pendingTranscript ? `${pendingTranscript} ${text}` : text;
    setPendingTranscript(newTranscript);

    // Wait 1s of silence after a final result before sending to AI
    transcriptTimerRef.current = setTimeout(() => {
      if (newTranscript === lastMessageRef.current) return;
      lastMessageRef.current = newTranscript;
      setPendingTranscript('');
      sendMessageToAI(newTranscript);
    }, 1000);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Stop any ongoing TTS immediately
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
    }
    setIsAISpeaking(false);

    try {
      // Export diagram
      let diagramImage = null;
      if (excalidrawAPI) {
        diagramImage = await exportDiagramAsImage(excalidrawAPI);
      }

      // Call evaluate API
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          provider: selectedProvider,
          model: selectedModel,
          apiKey: apiKeys[selectedProvider],
          topic: selectedTopic,
          diagramImage,
          ragContext,
        }),
      });

      const feedback = await response.json();
      setFeedback(feedback);
      endInterview();
    } catch (error) {
      console.error('Error submitting interview:', error);
      alert('Failed to submit interview. Please try again.');
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (timeRemaining / (30 * 60)) * 100;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Pause Overlay */}
      {isPaused && hasStartedInterview && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-10 flex flex-col items-center gap-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900">Interview Paused</h2>
            <Button size="lg" className="w-48" onClick={resumeInterview}>
              <Play className="mr-2 h-5 w-5" /> Resume
            </Button>
          </div>
        </div>
      )}

      {/* Start Interview Overlay */}
      {!hasStartedInterview && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-10 flex flex-col items-center gap-4 shadow-2xl max-w-sm w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900">{selectedTopic}</h2>
            <p className="text-gray-500 text-center text-sm">
              Your interviewer is ready. Click below when you are.
            </p>
            <Button
              size="lg"
              className="w-full mt-2 text-base"
              onClick={() => setHasStartedInterview(true)}
            >
              Start Interview
            </Button>
          </div>
        </div>
      )}
      {/* Top Bar - Timer and Controls */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900">{selectedTopic}</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-2xl font-mono font-bold text-gray-900">
              {formatTime(timeRemaining)}
            </span>
            <Progress value={progressPercentage} className="w-32 h-1" />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={isPaused ? resumeInterview : pauseInterview}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
            <Send className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Side - Cameras */}
        <div className="w-48 bg-gray-900 p-4 space-y-4">
          <CameraView
            isEnabled={isCameraEnabled}
            onToggle={toggleCamera}
            isInterviewer={false}
            isSpeaking={isUserSpeaking}
          />
          <CameraView
            isEnabled={true}
            onToggle={() => {}}
            isInterviewer={true}
            isSpeaking={isAISpeaking}
          />

          {/* Microphone Control */}
          <div className="pt-4">
            <SpeechInterface
              onTranscript={handleTranscript}
              onSpeakText={speakText}
              isListening={isListening}
              onListeningChange={setIsListening}
              onSpeakingChange={(speaking) => {
                setIsUserSpeaking(speaking);
                if (speaking) interruptAI();
              }}
              isAISpeaking={isAISpeaking}
            />
          </div>

          {/* Status */}
          <div className="text-xs text-gray-400 pt-4 space-y-2">
            {isLoading && <div className="text-blue-400">AI is thinking...</div>}
            {isListening && <div className="text-green-400">Listening...</div>}
            {pendingTranscript && (
              <div className="text-yellow-400 p-2 bg-gray-800 rounded text-[10px] max-h-20 overflow-y-auto">
                <div className="font-semibold mb-1">You're saying:</div>
                <div className="italic">{pendingTranscript}</div>
                <div className="mt-1 text-gray-500">⏱️ Will send in 3s...</div>
              </div>
            )}

            {/* Test TTS Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                console.log('Testing TTS...');
                setIsAISpeaking(true);
                speakText('Hello! This is a test of the text to speech system. Can you hear me?', () => {
                  console.log('Test complete');
                  setIsAISpeaking(false);
                }, apiKeys['openai']);
              }}
            >
              Test Voice
            </Button>
          </div>
        </div>

        {/* Right Side - Diagram */}
        <div className="flex-1">
          <ExcalidrawWrapper onReady={setExcalidrawAPI} />
        </div>
      </div>
    </div>
  );
}
