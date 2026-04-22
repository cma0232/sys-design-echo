'use client';

import { useState } from 'react';
import { useInterviewStore } from '@/lib/store/interview-store';
import { APISettings } from '@/components/interview/api-settings';
import { InterviewSetup } from '@/components/interview/interview-setup';
import { InterviewSession } from '@/components/interview/interview-session';
import { FeedbackView } from '@/components/interview/feedback-view';

export default function InterviewPage() {
  const { isActive, feedback, apiKeys, selectedProvider } = useInterviewStore();
  const [hasAPIKey, setHasAPIKey] = useState(!!apiKeys[selectedProvider]);
  const [hasStarted, setHasStarted] = useState(false);

  if (feedback) {
    return <FeedbackView />;
  }

  if (isActive && hasStarted) {
    return <InterviewSession />;
  }

  if (hasAPIKey) {
    return <InterviewSetup onStart={() => setHasStarted(true)} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <APISettings onComplete={() => setHasAPIKey(true)} />
    </div>
  );
}
