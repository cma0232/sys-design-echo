'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';

interface SpeechInterfaceProps {
  onTranscript: (text: string, isFinal: boolean) => void;
  onSpeakText: (text: string) => void;
  isListening: boolean;
  onListeningChange: (isListening: boolean) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  isAISpeaking?: boolean;
}

export function SpeechInterface({
  onTranscript,
  onSpeakText,
  isListening,
  onListeningChange,
  onSpeakingChange,
  isAISpeaking = false,
}: SpeechInterfaceProps) {
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(isListening);
  const pausedByAIRef = useRef(false); // tracks if WE paused recognition due to AI speaking
  const [isSupported, setIsSupported] = useState(true);
  const [hasAudioInput, setHasAudioInput] = useState<boolean | null>(null);

  // Keep ref in sync so onend closure always sees latest value
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Check microphone permissions and availability
  useEffect(() => {
    if (typeof window === 'undefined') return;

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(async (stream) => {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        console.log('🎤 Available microphones:', audioInputs.map(d => d.label));
        setHasAudioInput(true);
        stream.getTracks().forEach(track => track.stop());
      })
      .catch(() => setHasAudioInput(false));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const result = event.results[last];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;

      // User is speaking — immediately stop AI TTS
      window.speechSynthesis.cancel();
      onSpeakingChange?.(true);

      // Only forward final results to the transcript handler
      // interim results are used only to cancel AI speech and reset the silence timer
      onTranscript(transcript, isFinal);

      if (isFinal) {
        setTimeout(() => onSpeakingChange?.(false), 500);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error);
      if (event.error !== 'aborted') {
        onListeningChange(false);
      }
    };

    recognition.onend = () => {
      // Only restart if user wants to listen AND we didn't pause for AI
      if (isListeningRef.current && !pausedByAIRef.current) {
        try {
          recognition.start();
        } catch (_) {}
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  // Start/stop based on user toggle
  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      pausedByAIRef.current = false;
      try {
        recognitionRef.current.start();
      } catch (_) {}
    } else {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
  }, [isListening]);

  // Pause mic while AI is speaking to prevent echo
  useEffect(() => {
    if (!recognitionRef.current || !isListening) return;

    if (isAISpeaking) {
      pausedByAIRef.current = true;
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    } else {
      // Resume after AI finishes — small delay to clear speaker echo
      const timer = setTimeout(() => {
        if (isListeningRef.current) {
          pausedByAIRef.current = false;
          try {
            recognitionRef.current?.start();
          } catch (_) {}
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isAISpeaking]);

  const toggleListening = () => {
    onListeningChange(!isListening);
  };

  if (!isSupported) {
    return (
      <div className="text-sm text-red-500">
        Speech recognition not supported in this browser. Please use Chrome or Edge.
      </div>
    );
  }

  if (hasAudioInput === false) {
    return (
      <div className="text-sm text-red-500">
        ❌ Microphone access denied. Please allow microphone access in your browser settings and refresh the page.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        variant={isListening ? 'destructive' : 'default'}
        size="lg"
        onClick={toggleListening}
        className="gap-2 w-full"
      >
        {isListening ? (
          <>
            <MicOff className="h-5 w-5" />
            Stop Speaking
          </>
        ) : (
          <>
            <Mic className="h-5 w-5" />
            Start Speaking
          </>
        )}
      </Button>
      {hasAudioInput === null && (
        <div className="text-xs text-gray-400">Checking microphone...</div>
      )}
      {hasAudioInput === true && (
        <div className="text-xs text-green-400">✓ Microphone ready</div>
      )}
    </div>
  );
}

// Text-to-Speech utility
export function speakText(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.error('Speech Synthesis not supported');
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  if (onEnd) {
    utterance.onend = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}
