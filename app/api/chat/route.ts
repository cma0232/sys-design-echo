'use server';

import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LLMProvider } from '@/types';

export async function POST(req: Request) {
  try {
    const { messages, provider, apiKey, topic, ragContext } = await req.json();

    if (!messages || !provider || !apiKey || !topic) {
      return new Response('Missing required fields', { status: 400 });
    }

    let model;
    switch (provider as LLMProvider) {
      case 'anthropic': {
        const anthropicProvider = createAnthropic({ apiKey });
        model = anthropicProvider('claude-sonnet-4-6');
        break;
      }
      case 'openai': {
        const openaiProvider = createOpenAI({ apiKey });
        model = openaiProvider('gpt-4o');
        break;
      }
      case 'google': {
        const googleProvider = createGoogleGenerativeAI({ apiKey });
        model = googleProvider('gemini-2.5-pro');
        break;
      }
      default:
        return new Response('Invalid provider', { status: 400 });
    }

    const knowledgeSection = ragContext
      ? `## RELEVANT KNOWLEDGE BASE\nUse the following frontend system design knowledge to ask informed, specific questions and follow-ups:\n\n${ragContext}`
      : '';

    const systemPrompt = `You are an expert Frontend System Design interviewer at a top tech company (Meta, Google, Airbnb level).

## TOPIC
${topic}

${knowledgeSection}

## YOUR ROLE
- Focus exclusively on FRONTEND architecture — components, state, data flow, rendering, performance, UX
- Do NOT discuss backend infrastructure, databases, or distributed systems
- Use the CCDAO framework to guide the interview: Clarify → Component Structure → Data Modeling → API Design → Optimization
- Ask one focused question at a time, then probe deeper based on their answer
- DO NOT provide solutions — ask questions that guide the candidate to think through problems themselves
- Keep each response to 2-3 sentences max (this is a voice conversation)

## EVALUATION DIMENSIONS TO PROBE
- **Problem Framing**: Do they ask clarifying questions? Define scope?
- **Architecture Design**: Component hierarchy, state management, data flow
- **Trade-off Discussion**: Do they proactively compare multiple approaches?
- **Communication**: Are they leading the discussion or waiting to be prompted?

## CONTEXT
The candidate is drawing a system design diagram while talking. Reference their diagram when appropriate.
Start with requirements clarification, then guide through component design, data modeling, and optimizations.`;

    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Interview API error:', error);
    return new Response(error.message || 'Internal server error', { status: 500 });
  }
}
