'use client';

import { useState } from 'react';
import { useInterviewStore } from '@/lib/store/interview-store';
import { APISettings } from '@/components/interview/api-settings';
import { DebugSession } from '@/components/code-debug/debug-session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { reactDebugQuestions } from '@/lib/questions/react-debug';
import { typescriptQuestions } from '@/lib/questions/typescript';

type Mode = 'react' | 'typescript';

export default function CodeDebugPage() {
  const { apiKeys, selectedProvider } = useInterviewStore();
  const [hasAPIKey, setHasAPIKey] = useState(!!apiKeys[selectedProvider]);
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [flagged, setFlagged] = useState<Set<string>>(new Set());

  const handleComplete = (id: string) => {
    setCompleted((prev) => new Set(prev).add(id));
  };

  const handleToggleFlag = (id: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (!hasAPIKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <APISettings onComplete={() => setHasAPIKey(true)} />
      </div>
    );
  }

  if (selectedMode) {
    const questions = selectedMode === 'react' ? reactDebugQuestions : typescriptQuestions;
    const question = questions[questionIndex];
    const modeColor = selectedMode === 'react' ? 'blue' : 'purple';

    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Left sidebar: question list */}
        <div className="w-64 shrink-0 border-r bg-white flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              {selectedMode === 'react' ? 'React Debug' : 'TypeScript'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-400 h-auto px-2 py-1"
              onClick={() => { setSelectedMode(null); setQuestionIndex(0); }}
            >
              ← Back
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {questions.map((q, i) => {
              const isDone = completed.has(q.id);
              const isFlagged = flagged.has(q.id);
              const isCurrent = i === questionIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setQuestionIndex(i)}
                  className={`w-full text-left px-4 py-2.5 flex items-start gap-2 hover:bg-gray-50 transition-colors ${
                    isCurrent ? 'bg-gray-100 border-r-2 border-gray-800' : ''
                  }`}
                >
                  {/* Status dot */}
                  <span className="mt-0.5 shrink-0">
                    {isFlagged ? (
                      <span className="text-amber-500 text-xs">★</span>
                    ) : isDone ? (
                      <span className="text-green-500 text-xs">✓</span>
                    ) : (
                      <span className={`inline-block w-2 h-2 rounded-full mt-1 ${isCurrent ? 'bg-gray-800' : 'bg-gray-300'}`} />
                    )}
                  </span>
                  <span className={`text-xs leading-snug ${isCurrent ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                    {i + 1}. {q.title}
                  </span>
                  {q.tags?.includes('Foxglove') && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-orange-100 text-orange-600 font-semibold shrink-0 ml-auto">
                      FG
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Progress summary */}
          <div className="border-t px-4 py-3 text-xs text-gray-500 space-y-0.5">
            <div>Done: {completed.size} / {questions.length}</div>
            <div>Review: {[...flagged].filter(id => questions.some(q => q.id === id)).length}</div>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 overflow-hidden">
          <DebugSession
            question={question}
            mode={selectedMode}
            questionIndex={questionIndex}
            total={questions.length}
            isFlagged={flagged.has(question.id)}
            onNext={() => setQuestionIndex((i) => Math.min(i + 1, questions.length - 1))}
            onComplete={handleComplete}
            onToggleFlag={handleToggleFlag}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>← Home</Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Code Debug Practice</h1>
            <p className="text-sm text-gray-500">Find and fix bugs like a real interview</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card
            className="cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
            onClick={() => { setSelectedMode('react'); setQuestionIndex(0); }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                React Debug
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                  {reactDebugQuestions.length} questions
                </span>
              </CardTitle>
              <CardDescription>
                Spot bugs in React components — hooks, state, effects, and more
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• useEffect & closure traps</li>
                <li>• State mutation & stale data</li>
                <li>• Memory leaks & race conditions</li>
                <li>• Rules of Hooks violations</li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-purple-400 hover:shadow-md transition-all"
            onClick={() => { setSelectedMode('typescript'); setQuestionIndex(0); }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                TypeScript
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                  {typescriptQuestions.length} questions
                </span>
              </CardTitle>
              <CardDescription>
                Fix type errors and unsafe patterns in TypeScript code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Union types & type guards</li>
                <li>• Generics & utility types</li>
                <li>• Discriminated unions</li>
                <li>• Type assertion safety</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
