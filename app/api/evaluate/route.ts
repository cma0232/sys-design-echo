'use server';

import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LLMProvider } from '@/types';

export async function POST(req: Request) {
  try {
    const { messages, provider, apiKey, topic, diagramImage } = await req.json();

    // Create model with the API key from request
    let model;
    switch (provider as LLMProvider) {
      case 'anthropic': {
        const anthropicProvider = createAnthropic({ apiKey });
        model = anthropicProvider('claude-3-5-sonnet-20241022');
        break;
      }
      case 'openai': {
        const openaiProvider = createOpenAI({ apiKey });
        // Use vision-capable model for image analysis
        model = openaiProvider('gpt-4-turbo');
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

    const systemPrompt = `You are an experienced technical interviewer evaluating a system design interview.

Topic: ${topic}

Evaluate the candidate's performance across three dimensions and provide scores (1-5) and detailed feedback for each:

1. **Scalability**: How well did they address scalability concerns, bottlenecks, and growth?
2. **Trade-offs**: Did they identify and discuss trade-offs between different approaches?
3. **Communication**: How clearly did they explain their thinking and design decisions?

Also provide overall feedback and suggestions for improvement.

Conversation History:
${conversationHistory}

${diagramImage ? 'The candidate also provided a system design diagram (image attached).' : ''}

Respond with a JSON object in this exact format:
{
  "scalability": {
    "score": <1-5>,
    "feedback": "<detailed feedback>"
  },
  "tradeoffs": {
    "score": <1-5>,
    "feedback": "<detailed feedback>"
  },
  "communication": {
    "score": <1-5>,
    "feedback": "<detailed feedback>"
  },
  "overallFeedback": "<overall assessment and improvement suggestions>"
}`;

    const userContent: any[] = [
      {
        type: 'text',
        text: 'Please evaluate this system design interview based on the conversation history.',
      },
    ];

    // Add diagram image if provided
    if (diagramImage) {
      console.log('📊 Adding diagram image to evaluation');
      console.log('📊 Image data length:', diagramImage.length);
      console.log('📊 Image format:', diagramImage.substring(0, 30) + '...');

      userContent.push({
        type: 'image',
        image: diagramImage, // base64 data URL format: data:image/png;base64,...
      });
    }

    const result = await generateText({
      model,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
      temperature: 0.3,
      maxOutputTokens: 1500,
    });

    // Parse JSON from response
    const feedbackText = result.text.trim();
    // Extract JSON from markdown code blocks if present
    const jsonMatch = feedbackText.match(/```json\n([\s\S]*?)\n```/) ||
                     feedbackText.match(/```\n([\s\S]*?)\n```/);
    const jsonText = jsonMatch ? jsonMatch[1] : feedbackText;
    const feedback = JSON.parse(jsonText);

    return Response.json(feedback);
  } catch (error: any) {
    console.error('Evaluate API error:', error);
    return new Response(error.message || 'Internal server error', {
      status: 500,
    });
  }
}
