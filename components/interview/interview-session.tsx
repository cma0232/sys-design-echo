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

  const [isListening, setIsListening] = useState(false);
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingTranscript, setPendingTranscript] = useState<string>('');
  const lastMessageRef = useRef<string>('');
  const hasStartedRef = useRef(false);
  const transcriptTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Manual function to send message and handle streaming response
  const sendMessageToAI = async (userMessage: string) => {
    if (isLoading) return;

    console.log('📤 Sending message to AI:', userMessage);
    setIsLoading(true);

    // Add user message to state
    const userMsg: Message = {
      role: 'user',
      content: userMessage,
      id: Date.now().toString(),
    };
    setMessages((prev) => [...prev, userMsg]);

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
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          provider: selectedProvider,
          apiKey: apiKeys[selectedProvider],
          topic: selectedTopic,
        }),
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
      setMessages((prev) => [...prev, assistantMsg]);

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
      });

    } catch (error) {
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

  // Start with interviewer's first question - only once
  useEffect(() => {
    if (!hasStartedRef.current && messages.length === 0) {
      hasStartedRef.current = true;

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
      const initialMessage = `Hello! I'm ready to discuss the ${selectedTopic} system design. Please start by asking me your first question.`;
      console.log('📤 Sending initial message to AI...');
      sendMessageToAI(initialMessage);
    }
  }, [messages.length, selectedTopic, apiKeys, selectedProvider, endInterview]);

  const handleTranscript = async (text: string) => {
    console.log('🎤 Transcript received:', text);
    console.log('🎤 isLoading:', isLoading);

    if (!text || isLoading) {
      console.log('⚠️ Ignoring transcript - empty or loading');
      return;
    }

    // Clear any existing timer
    if (transcriptTimerRef.current) {
      clearTimeout(transcriptTimerRef.current);
      console.log('⏱️ Cleared previous timer, user is still speaking...');
    }

    // Accumulate transcript (in case of multiple chunks)
    const newTranscript = pendingTranscript ? `${pendingTranscript} ${text}` : text;
    setPendingTranscript(newTranscript);
    console.log('📝 Pending transcript:', newTranscript);

    // Wait 3 seconds of silence before sending to AI
    transcriptTimerRef.current = setTimeout(() => {
      console.log('✅ User finished speaking, sending to AI:', newTranscript);

      // Avoid duplicate messages
      if (newTranscript === lastMessageRef.current) {
        console.log('⚠️ Ignoring duplicate message');
        return;
      }
      lastMessageRef.current = newTranscript;

      // Clear pending and send
      setPendingTranscript('');
      sendMessageToAI(newTranscript);
    }, 3000); // 3 seconds delay

    console.log('⏱️ Timer started - waiting for user to finish speaking...');
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
              onSpeakingChange={setIsUserSpeaking}
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
                });
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
