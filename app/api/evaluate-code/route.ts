'use server';

import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LLMProvider } from '@/types';

export interface CodeEvalResult {
  found: string[];
  missed: string[];
  falsePositives: string[];
  score: number; // 0-100
  summary: string;
}

export async function POST(req: Request) {
  try {
    const { provider, apiKey, model: modelId, question, userCode } = await req.json();

    if (!provider || !apiKey || !question || userCode === undefined) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let model;
    switch (provider as LLMProvider) {
      case 'anthropic': {
        model = createAnthropic({ apiKey })(modelId || 'claude-haiku-4-5-20251001');
        break;
      }
      case 'openai': {
        model = createOpenAI({ apiKey })(modelId || 'gpt-4o-mini');
        break;
      }
      case 'google': {
        model = createGoogleGenerativeAI({ apiKey })(modelId || 'gemini-2.0-flash');
        break;
      }
      default:
        return Response.json({ error: 'Invalid provider' }, { status: 400 });
    }

    const prompt = `You are evaluating a coding interview answer. The candidate was given buggy code and asked to fix it.

## Question
Title: ${question.title}
Description: ${question.description}

## Original Buggy Code
\`\`\`
${question.code}
\`\`\`

## Known Bugs (ground truth)
${question.bugs.map((b: string, i: number) => `${i + 1}. ${b}`).join('\n')}

## Candidate's Fixed Code
\`\`\`
${userCode}
\`\`\`

Compare the candidate's code to the original. Determine which bugs they fixed, which they missed, and if they introduced any unnecessary or incorrect changes.

Respond with ONLY a JSON object in this exact format, no markdown:
{
  "found": ["description of bug they correctly fixed"],
  "missed": ["description of bug they did not fix"],
  "falsePositives": ["description of incorrect change they made that wasn't needed or broke something"],
  "score": <integer 0-100>,
  "summary": "<2-3 sentence plain English summary of their performance>"
}`;

    const { text } = await generateText({ model, prompt });

    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const result: CodeEvalResult = JSON.parse(cleaned);
    return Response.json(result);
  } catch (error: any) {
    console.error('evaluate-code error:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
