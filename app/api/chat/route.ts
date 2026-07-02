'use server';

import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LLMProvider } from '@/types';

export async function POST(req: Request) {
  try {
    const { messages, provider, apiKey, model: modelId, topic, ragContext } = await req.json();

    if (!messages || !provider || !apiKey || !topic) {
      return new Response('Missing required fields', { status: 400 });
    }

    let model;
    switch (provider as LLMProvider) {
      case 'anthropic': {
        const anthropicProvider = createAnthropic({ apiKey });
        model = anthropicProvider(modelId || 'claude-sonnet-4-6');
        break;
      }
      case 'openai': {
        const openaiProvider = createOpenAI({ apiKey });
        model = openaiProvider(modelId || 'gpt-4o');
        break;
      }
      case 'google': {
        const googleProvider = createGoogleGenerativeAI({ apiKey });
        model = googleProvider(modelId || 'gemini-2.0-flash');
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

## HOW TO RESPOND
Respond like a senior engineer having a real conversation — not a script reader.

- **Answer what was asked.** If the candidate asked a question, answer it. If they said something unclear, ask them to clarify that specific thing.
- **Be concrete when asked for constraints.** Scale, users, latency targets — make a decision and state it. ("Let's say 50K DAU." "Assume p95 latency under 200ms.")
- **When uncertain what they mean or what to say next**, use a natural bridging response — acknowledge what they said ("Got it.", "That makes sense.") and either ask one specific follow-up or say something like "Tell me more about that." Never fill silence by repeating the problem statement.
- **After they explain a design decision**, pick the most interesting part and probe deeper with one question.
- **Never repeat the scenario intro** — it's already been said. Reference specific details from it only if directly relevant.
- Keep responses to 2-3 sentences max. This is a spoken conversation.

## OPENING
When the conversation history has only one user message (the interview start trigger), set the scene in one short paragraph: give a concrete product scenario with real numbers, name one specific technical pain point, then say "Go ahead and walk me through how you'd approach this." Nothing else — no questions, no lists.

## WHAT TO PROBE (when relevant)
- Component hierarchy and state ownership
- Data fetching strategy and caching
- Performance at scale (virtualization, pagination, lazy loading)
- Trade-offs they proactively surface

## CONTEXT
The candidate is drawing a diagram while talking. Occasionally reference it ("looks like you've got X on the canvas — how does that connect to Y?").`;

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
