'use server';

import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import type { LLMProvider } from '@/types';

export async function POST(req: Request) {
  try {
    const { messages, provider, apiKey, topic } = await req.json();

    if (!apiKey) {
      return new Response('API key is required', { status: 400 });
    }

    // Select model based on provider
    let model;
    switch (provider as LLMProvider) {
      case 'anthropic':
        model = anthropic('claude-3-5-sonnet-20241022', { apiKey });
        break;
      case 'openai':
        model = openai('gpt-4-turbo-preview', { apiKey });
        break;
      case 'google':
        model = google('gemini-1.5-pro', { apiKey });
        break;
      default:
        return new Response('Invalid provider', { status: 400 });
    }

    const systemPrompt = `You are an experienced technical interviewer conducting a system design interview.

Topic: ${topic}

Your role:
- Ask thoughtful, probing questions about the system design
- Focus on scalability, trade-offs, and architectural decisions
- Guide the candidate through different aspects: requirements, high-level design, detailed design, scalability, etc.
- Be encouraging but thorough
- Ask follow-up questions based on their responses
- DO NOT provide solutions - let the candidate think through problems
- Keep responses concise and conversational (this is a voice conversation)

Remember: The candidate is drawing a diagram while talking. Reference their diagram when appropriate.

Start by asking about requirements and constraints. Then progressively dive deeper into the design.`;

    const result = await streamText({
      model,
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: 500,
    });

    return result.toAIStreamResponse();
  } catch (error: any) {
    console.error('Interview API error:', error);
    return new Response(error.message || 'Internal server error', {
      status: 500,
    });
  }
}
