'use server';

import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LLMProvider } from '@/types';

export async function POST(req: Request) {
  try {
    const { messages, provider, apiKey, topic } = await req.json();

    if (!messages || !provider || !apiKey || !topic) {
      return new Response('Missing required fields', { status: 400 });
    }

    console.log('🔧 Interview API received:');
    console.log('  Provider:', provider);
    console.log('  API Key exists:', !!apiKey);
    console.log('  Topic:', topic);

    let model;

    // Create provider and model with the API key from request
    switch (provider as LLMProvider) {
      case 'anthropic': {
        const anthropicProvider = createAnthropic({ apiKey });
        model = anthropicProvider('claude-3-5-sonnet-20241022');
        break;
      }
      case 'openai': {
        const openaiProvider = createOpenAI({ apiKey });
        model = openaiProvider('gpt-4-turbo-preview');
        break;
      }
      case 'google': {
        const googleProvider = createGoogleGenerativeAI({ apiKey });
        model = googleProvider('gemini-1.5-pro');
        break;
      }
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
      maxOutputTokens: 500,
    });

    return result.toAIStreamResponse();
  } catch (error: any) {
    console.error('Interview API error:', error);
    return new Response(error.message || 'Internal server error', {
      status: 500,
    });
  }
}
