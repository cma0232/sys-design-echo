'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useInterviewStore } from '@/lib/store/interview-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReactDebugQuestion } from '@/lib/questions/react-debug';
import type { TypeScriptQuestion } from '@/lib/questions/typescript';
import type { CodeEvalResult } from '@/app/api/evaluate-code/route';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type Question = ReactDebugQuestion | TypeScriptQuestion;

interface DebugSessionProps {
  question: Question;
  mode: 'react' | 'typescript';
  onNext: () => void;
  onComplete: (questionId: string) => void;
  isFlagged: boolean;
  onToggleFlag: (questionId: string) => void;
  questionIndex: number;
  total: number;
}

export function DebugSession({
  question,
  mode,
  onNext,
  onComplete,
  isFlagged,
  onToggleFlag,
  questionIndex,
  total,
}: DebugSessionProps) {
  const { apiKeys, selectedProvider, selectedModel } = useInterviewStore();
  const [code, setCode] = useState(question.code);
  const [result, setResult] = useState<CodeEvalResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset editor when question changes
  useEffect(() => {
    setCode(question.code);
    setResult(null);
    setError(null);
  }, [question.id]);

  const handleSubmit = async () => {
    setIsEvaluating(true);
    setError(null);
    try {
      const res = await fetch('/api/evaluate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKeys[selectedProvider],
          model: selectedModel,
          question,
          userCode: code,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      onComplete(question.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNext = () => {
    onNext();
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Top bar */}
      <div className="border-b bg-white px-6 py-3 flex items-center justify-between shrink-0">
        <span className="text-sm text-gray-500">
          {mode === 'react' ? 'React Debug' : 'TypeScript'} — Question {questionIndex + 1} / {total}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant={isFlagged ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToggleFlag(question.id)}
            className={isFlagged ? 'bg-amber-500 hover:bg-amber-600 border-amber-500' : ''}
          >
            {isFlagged ? '★ Review Again' : '☆ Review Again'}
          </Button>
          <Button onClick={handleSubmit} disabled={isEvaluating}>
            {isEvaluating ? 'Evaluating...' : 'Submit'}
          </Button>
          {result && questionIndex < total - 1 && (
            <Button variant="outline" onClick={handleNext}>Next →</Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Question + Result */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                  {question.title}
                  {question.tags?.includes('Foxglove') && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-semibold">
                      Foxglove
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{question.description}</p>
              </CardContent>
            </Card>

            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Result</span>
                    <span className={`text-2xl font-bold ${scoreColor(result.score)}`}>
                      {result.score}/100
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <p className="text-gray-700">{result.summary}</p>

                  {result.found.length > 0 && (
                    <div>
                      <p className="font-medium text-green-700 mb-1">Bugs fixed ({result.found.length})</p>
                      <ul className="space-y-1">
                        {result.found.map((f, i) => (
                          <li key={i} className="flex gap-2 text-green-700">
                            <span>✓</span><span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.missed.length > 0 && (
                    <div>
                      <p className="font-medium text-red-700 mb-1">Bugs missed ({result.missed.length})</p>
                      <ul className="space-y-1">
                        {result.missed.map((m, i) => (
                          <li key={i} className="flex gap-2 text-red-700">
                            <span>✗</span><span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.falsePositives.length > 0 && (
                    <div>
                      <p className="font-medium text-yellow-700 mb-1">Unnecessary changes ({result.falsePositives.length})</p>
                      <ul className="space-y-1">
                        {result.falsePositives.map((f, i) => (
                          <li key={i} className="flex gap-2 text-yellow-700">
                            <span>⚠</span><span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-2 border-t space-y-3">
                    <div>
                      <p className="font-medium text-gray-700 mb-2">Correct Answers</p>
                      <ul className="space-y-1">
                        {question.bugs.map((bug, i) => (
                          <li key={i} className="flex gap-2 text-gray-700 text-xs bg-gray-50 rounded p-2">
                            <span className="font-mono text-gray-400 shrink-0">{i + 1}.</span>
                            <span>{bug}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="font-medium text-gray-700 mb-2">Solution</p>
                      <div className="rounded overflow-hidden border">
                        <MonacoEditor
                          height="280px"
                          language="typescript"
                          value={question.solution}
                          theme="vs-dark"
                          options={{
                            readOnly: true,
                            fontSize: 12,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            wordWrap: 'on',
                            lineNumbers: 'on',
                            renderLineHighlight: 'none',
                            tabSize: 2,
                            scrollbar: { vertical: 'auto' },
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <p className="font-medium text-gray-700 mb-1">Explanation</p>
                      <p className="text-gray-600 text-sm">{question.explanation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                {error}
              </div>
            )}
          </div>

          {/* Right: Editor */}
          <div className="rounded-lg overflow-hidden border bg-[#1e1e1e]">
            <div className="px-4 py-2 bg-[#2d2d2d] text-xs text-gray-400 border-b border-gray-700">
              {mode === 'react' ? 'component.tsx' : 'types.ts'} — edit the code below to fix the bugs
            </div>
            <MonacoEditor
              height="calc(100vh - 200px)"
              language="typescript"
              value={code}
              onChange={(val) => setCode(val ?? '')}
              theme="vs-dark"
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                tabSize: 2,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
