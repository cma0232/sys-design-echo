'use client';

import { useInterviewStore } from '@/lib/store/interview-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function FeedbackView() {
  const { feedback, selectedTopic, reset } = useInterviewStore();

  if (!feedback) return null;

  const renderScore = (score: number, label: string, feedbackText: string) => {
    const percentage = (score / 4) * 100;
    const color = score >= 3 ? 'bg-green-500' : score >= 2 ? 'bg-yellow-500' : 'bg-red-500';

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{label}</h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">{score}</span>
            <span className="text-gray-500">/4</span>
          </div>
        </div>
        <Progress value={percentage} className={`h-2 ${color}`} />
        <p className="text-sm text-gray-600 leading-relaxed">{feedbackText}</p>
      </div>
    );
  };

  const averageScore = (
    (feedback.problemFraming.score +
      feedback.architectureDesign.score +
      feedback.tradeoffDiscussion.score +
      feedback.communicationDrive.score) /
    4
  ).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Interview Feedback</CardTitle>
            <CardDescription>{selectedTopic}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold text-gray-900">{averageScore}</div>
              <div className="text-gray-600">
                <div className="font-medium">Overall Score</div>
                <div className="text-sm">Average across 4 core dimensions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detailed Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderScore(feedback.problemFraming.score, 'Problem Framing', feedback.problemFraming.feedback)}
            <div className="border-t pt-6">
              {renderScore(feedback.architectureDesign.score, 'Architecture Design', feedback.architectureDesign.feedback)}
            </div>
            <div className="border-t pt-6">
              {renderScore(feedback.tradeoffDiscussion.score, 'Trade-off Discussion', feedback.tradeoffDiscussion.feedback)}
            </div>
            <div className="border-t pt-6">
              {renderScore(feedback.communicationDrive.score, 'Communication & Drive', feedback.communicationDrive.feedback)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overall Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {feedback.overallFeedback}
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button onClick={reset} size="lg" className="flex-1">
            Practice Again
          </Button>
        </div>
      </div>
    </div>
  );
}
