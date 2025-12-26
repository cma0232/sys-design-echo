'use client';

import { useState } from 'react';
import { useInterviewStore } from '@/lib/store/interview-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SYSTEM_DESIGN_TOPICS } from '@/types';

export function InterviewSetup({ onStart }: { onStart: () => void }) {
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const { startInterview } = useInterviewStore();

  const handleStart = () => {
    if (selectedTopic) {
      startInterview(selectedTopic);
      onStart();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>System Design Interview</CardTitle>
          <CardDescription>
            Select a topic to begin your 30-minute practice interview
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Topic</label>
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a system design topic..." />
              </SelectTrigger>
              <SelectContent>
                {SYSTEM_DESIGN_TOPICS.map((topic) => (
                  <SelectItem key={topic} value={topic}>
                    {topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h3 className="font-medium text-blue-900">Interview Format</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Duration: 30 minutes</li>
              <li>• Voice-based conversation (speak your answers)</li>
              <li>• Draw your system design diagram as you explain</li>
              <li>• Get detailed feedback on scalability, trade-offs, and communication</li>
            </ul>
          </div>

          <Button
            onClick={handleStart}
            className="w-full"
            size="lg"
            disabled={!selectedTopic}
          >
            Start Interview
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
