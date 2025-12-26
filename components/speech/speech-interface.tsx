'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';

interface SpeechInterfaceProps {
  onTranscript: (text: string) => void;
  onSpeakText: (text: string) => void;
  isListening: boolean;
  onListeningChange: (isListening: boolean) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

export function SpeechInterface({
  onTranscript,
  onSpeakText,
  isListening,
  onListeningChange,
  onSpeakingChange,
}: SpeechInterfaceProps) {
  const recognitionRef = useRef<any>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [hasAudioInput, setHasAudioInput] = useState<boolean | null>(null);

  // Check microphone permissions and availability
  useEffect(() => {
    if (typeof window === 'undefined') return;

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(async (stream) => {
        console.log('✅ Microphone access granted');

        // List all audio input devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        console.log('🎤 Available microphones:');
        audioInputs.forEach((device, index) => {
          console.log(`  ${index + 1}. ${device.label || 'Microphone ' + (index + 1)} (${device.deviceId})`);
        });

        // Check which microphone is currently being used
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          console.log('🎤 Currently using:', audioTrack.label);
          const settings = audioTrack.getSettings();
          console.log('🎤 Track settings:', settings);
        }

        setHasAudioInput(true);
        // Stop the stream immediately
        stream.getTracks().forEach(track => track.stop());
      })
      .catch((error) => {
        console.error('❌ Microphone access denied:', error);
        setHasAudioInput(false);
      });
  }, []);

  useEffect(() => {
    // Check if Web Speech API is supported
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      console.error('Speech Recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
    };

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;
      console.log('🎤 User said:', transcript);
      console.log('🎤 Calling onTranscript with:', transcript);
      onSpeakingChange?.(true);
      onTranscript(transcript);
      // Reset speaking state after a short delay
      setTimeout(() => onSpeakingChange?.(false), 1000);
    };

    recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error);
      console.error('❌ Error details:', event);
      onListeningChange(false);
    };

    recognition.onend = () => {
      console.log('🎤 Speech recognition ended. isListening:', isListening);
      if (isListening) {
        // Restart if we're still supposed to be listening
        console.log('🎤 Restarting speech recognition...');
        try {
          recognition.start();
        } catch (error) {
          console.error('❌ Error restarting recognition:', error);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!recognitionRef.current) {
      console.log('⚠️ recognitionRef.current is null');
      return;
    }

    if (isListening) {
      console.log('🎤 Attempting to start speech recognition...');
      try {
        recognitionRef.current.start();
        console.log('✅ Speech recognition start() called');
      } catch (error) {
        console.error('❌ Error starting recognition:', error);
      }
    } else {
      console.log('🎤 Stopping speech recognition...');
      try {
        recognitionRef.current.stop();
        console.log('✅ Speech recognition stop() called');
      } catch (error) {
        console.error('❌ Error stopping recognition:', error);
      }
    }
  }, [isListening]);

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

  // Cancel any ongoing speech
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
