'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Interview Practice
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Free, AI-powered practice for frontend engineering interviews
          </p>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link href="/interview" className="group">
            <Card className="h-full cursor-pointer border-2 border-transparent group-hover:border-blue-400 group-hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="text-3xl mb-2">🏗️</div>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">Voice</span>
                </div>
                <CardTitle className="text-xl">System Design</CardTitle>
                <CardDescription>
                  Practice frontend system design interviews with an AI interviewer. Speak your answers and draw your architecture in real time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-500 space-y-1.5">
                  <li>• 30-minute timed sessions</li>
                  <li>• Voice-based conversation</li>
                  <li>• Interactive diagram canvas</li>
                  <li>• Detailed feedback & scoring</li>
                </ul>
                <div className="mt-4 text-sm font-medium text-blue-600 group-hover:underline">
                  Start practicing →
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/code-debug" className="group">
            <Card className="h-full cursor-pointer border-2 border-transparent group-hover:border-purple-400 group-hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="text-3xl mb-2">🐛</div>
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">Code</span>
                </div>
                <CardTitle className="text-xl">Code Debug</CardTitle>
                <CardDescription>
                  Find and fix bugs in React and TypeScript code, just like a real debugging interview. Edit in the browser, submit, and get AI feedback.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-500 space-y-1.5">
                  <li>• React hooks & component bugs</li>
                  <li>• TypeScript type errors</li>
                  <li>• In-browser code editor</li>
                  <li>• AI-powered evaluation</li>
                </ul>
                <div className="mt-4 text-sm font-medium text-purple-600 group-hover:underline">
                  Start debugging →
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-12">
          Bring your own API key (Anthropic, OpenAI, or Google). Free tiers work.
        </p>
      </div>
    </div>
  );
}
