'use client';

import { useEffect, useState, useRef } from 'react';
import { useChat } from 'ai/react';
import { useInterviewStore } from '@/lib/store/interview-store';
import { CameraView } from '@/components/camera/camera-view';
import { ExcalidrawWrapper, exportDiagramAsImage } from '@/components/diagram/excalidraw-wrapper';
import { SpeechInterface, speakText } from '@/components/speech/speech-interface';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Pause, Play, Send } from 'lucide-react';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';

export function InterviewSession() {
  const {
    apiKeys,
    selectedProvider,
    selectedTopic,
    isPaused,
    timeRemaining,
    isCameraEnabled,
    pauseInterview,
    resumeInterview,
    decrementTime,
    toggleCamera,
    addMessage,
    setFeedback,
    endInterview,
  } = useInterviewStore();

  const [isListening, setIsListening] = useState(true); // Auto-start listening
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const lastMessageRef = useRef<string>('');
  const hasStartedRef = useRef(false);

  const { messages, append, isLoading } = useChat({
    api: '/api/interview',
    body: {
      provider: selectedProvider,
      apiKey: apiKeys[selectedProvider],
      topic: selectedTopic,
    },
    onFinish: (message) => {
      // Speak the assistant's response
      console.log('AI response received:', message.content);
      setIsAISpeaking(true);
      speakText(message.content, () => {
        console.log('AI finished speaking');
        setIsAISpeaking(false);
      });
      addMessage({
        role: 'assistant',
        content: message.content,
        timestamp: Date.now(),
      });
    },
  });

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

  // Start with interviewer's first question - only once
  useEffect(() => {
    if (!hasStartedRef.current && messages.length === 0) {
      hasStartedRef.current = true;
      append({
        role: 'user',
        content: `Hello! I'm ready to discuss the ${selectedTopic} system design. Please start by asking me your first question.`,
      });
    }
  }, [messages.length, selectedTopic, append]);

  const handleTranscript = async (text: string) => {
    if (!text || isLoading) return;

    // Avoid duplicate messages
    if (text === lastMessageRef.current) return;
    lastMessageRef.current = text;

    addMessage({
      role: 'user',
      content: text,
      timestamp: Date.now(),
    });

    await append({
      role: 'user',
      content: text,
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

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
          apiKey: apiKeys[selectedProvider],
          topic: selectedTopic,
          diagramImage,
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
          />
          <CameraView
            isEnabled={true}
            onToggle={() => {}}
            isInterviewer={true}
          />

          {/* Microphone Control */}
          <div className="pt-4">
            <SpeechInterface
              onTranscript={handleTranscript}
              onSpeakText={speakText}
              isListening={isListening}
              onListeningChange={setIsListening}
            />
          </div>

          {/* Status */}
          <div className="text-xs text-gray-400 pt-4">
            {isLoading && <div className="text-blue-400">AI is thinking...</div>}
            {isListening && <div className="text-green-400">Listening...</div>}
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
