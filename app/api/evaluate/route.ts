'use server';

import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LLMProvider } from '@/types';

export async function POST(req: Request) {
  try {
    const { messages, provider, apiKey, topic, diagramImage, ragContext } = await req.json();

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

    const conversationHistory = messages
      .map((m: any) => `${m.role}: ${m.content}`)
      .join('\n\n');

    const knowledgeSection = ragContext
      ? `## REFERENCE KNOWLEDGE\nUse this as the standard to evaluate the candidate's answer:\n\n${ragContext}\n\n`
      : '';

    const systemPrompt = `You are an expert Frontend System Design interviewer evaluating a candidate's performance.

## TOPIC
${topic}

${knowledgeSection}## EVALUATION RUBRIC
Score each dimension 1–4:
- 1: Not addressed
- 2: Mentioned but shallow
- 3: Clear discussion with reasoning
- 4: Deep insight, considers edge cases and second-order effects

### Core Dimensions (evaluate all):
1. **Problem Framing**: Did they ask clarifying questions? Define scope and constraints? Identify frontend-specific constraints?
2. **Architecture Design**: Was the component hierarchy logical? Was state management appropriate? Was data flow clear?
3. **Trade-off Discussion**: Did they proactively raise multiple approaches and compare them? Were decisions context-driven?
4. **Communication & Drive**: Did they lead the conversation? Was thinking structured? Did they handle follow-ups well?

## CONVERSATION
${conversationHistory}

${diagramImage ? '## DIAGRAM\nThe candidate provided a system design diagram (attached).' : ''}

Respond with ONLY a JSON object in this exact format:
{
  "problemFraming": { "score": <1-4>, "feedback": "<specific, actionable feedback>" },
  "architectureDesign": { "score": <1-4>, "feedback": "<specific, actionable feedback>" },
  "tradeoffDiscussion": { "score": <1-4>, "feedback": "<specific, actionable feedback>" },
  "communicationDrive": { "score": <1-4>, "feedback": "<specific, actionable feedback>" },
  "overallFeedback": "<2-3 sentences: overall assessment + top 1-2 things to improve>"
}`;

    const userContent: any[] = [
      { type: 'text', text: 'Please evaluate this frontend system design interview.' },
    ];

    if (diagramImage) {
      userContent.push({ type: 'image', image: diagramImage });
    }

    const result = await generateText({
      model,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
      temperature: 0.3,
      maxOutputTokens: 1500,
    });

    const feedbackText = result.text.trim();
    const jsonMatch =
      feedbackText.match(/```json\n([\s\S]*?)\n```/) ||
      feedbackText.match(/```\n([\s\S]*?)\n```/);
    const jsonText = jsonMatch ? jsonMatch[1] : feedbackText;
    const feedback = JSON.parse(jsonText);

    return Response.json(feedback);
  } catch (error: any) {
    console.error('Evaluate API error:', error);
    return new Response(error.message || 'Internal server error', { status: 500 });
  }
}
