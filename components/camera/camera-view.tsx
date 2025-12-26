'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Volume2 } from 'lucide-react';

interface CameraViewProps {
  isEnabled: boolean;
  onToggle: () => void;
  isInterviewer?: boolean;
  isSpeaking?: boolean;
}

export function CameraView({ isEnabled, onToggle, isInterviewer = false, isSpeaking = false }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (isEnabled && !isInterviewer) {
      // Start user camera
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((mediaStream) => {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch((err) => {
          console.error('Error accessing camera:', err);
        });
    }

    return () => {
      // Cleanup
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isEnabled, isInterviewer]);

  return (
    <div className="relative w-32 h-32 bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700">
      {isEnabled && !isInterviewer ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          {isInterviewer ? (
            // Interviewer avatar
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold text-white">
              AI
            </div>
          ) : (
            // User placeholder
            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-3xl font-bold text-gray-400">
              ?
            </div>
          )}
        </div>
      )}

      {!isInterviewer && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute bottom-2 right-2 h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
          onClick={onToggle}
        >
          {isEnabled ? (
            <Camera className="h-4 w-4 text-white" />
          ) : (
            <CameraOff className="h-4 w-4 text-white" />
          )}
        </Button>
      )}

      <div className="absolute bottom-2 left-2 flex items-center gap-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
        <span>{isInterviewer ? 'Interviewer' : 'You'}</span>
        {isSpeaking && (
          <Volume2 className="h-3 w-3 text-green-400 animate-pulse" />
        )}
      </div>
    </div>
  );
}
