'use client';

import { useState } from 'react';
import { useInterviewStore } from '@/lib/store/interview-store';
import { APISettings } from '@/components/interview/api-settings';
import { InterviewSetup } from '@/components/interview/interview-setup';
import { InterviewSession } from '@/components/interview/interview-session';
import { FeedbackView } from '@/components/interview/feedback-view';

export default function Home() {
  const [hasAPIKey, setHasAPIKey] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const { isActive, feedback } = useInterviewStore();

  // Show feedback if we have it
  if (feedback) {
    return <FeedbackView />;
  }

  // Show interview session if active
  if (isActive && hasStarted) {
    return <InterviewSession />;
  }

  // Show setup screen if API key is configured
  if (hasAPIKey) {
    return <InterviewSetup onStart={() => setHasStarted(true)} />;
  }

  // Show API settings first
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <APISettings onComplete={() => setHasAPIKey(true)} />
    </div>
  );
}
