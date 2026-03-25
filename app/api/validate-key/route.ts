'use server';

import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

import type { LLMProvider } from '@/types';

export async function POST(req: Request) {
  try {
    const { provider, apiKey } = await req.json();

    if (!provider || !apiKey) {
      return Response.json({ valid: false, error: 'Missing provider or API key' }, { status: 400 });
    }

    console.log('🔑 Validating API key for provider:', provider);
    console.log('🔑 API key length:', apiKey?.length);

    let model;

    // Create provider and model based on the provider type
    switch (provider as LLMProvider) {
      case 'anthropic': {
        const anthropicProvider = createAnthropic({ apiKey });
        model = anthropicProvider('claude-3-5-sonnet-20241022');
        break;
      }
      case 'openai': {
        const openaiProvider = createOpenAI({ apiKey });
        model = openaiProvider('gpt-3.5-turbo');
        break;
      }
      case 'google': {
        console.log('Creating Google Generative AI provider');
        const googleProvider = createGoogleGenerativeAI({ apiKey });
        model = googleProvider('gemini-2.5-pro');
        break;
      }
      default:
        return Response.json({ valid: false, error: 'Invalid provider' }, { status: 400 });
    }

    // Test the API key with a simple request
    const result = await generateText({
      model,
      prompt: 'Hello',
      maxOutputTokens: 10,
    });

    console.log('✅ API key validation successful');
    console.log('✅ Response:', result.text);

    return Response.json({ valid: true });
  } catch (error: any) {
    console.error('❌ API key validation failed:', error.message);

    // Return specific error messages
    let errorMessage = 'Invalid API key';
    if (error.message?.includes('API key')) {
      errorMessage = 'Invalid or missing API key';
    } else if (error.message?.includes('authentication')) {
      errorMessage = 'Authentication failed';
    } else if (error.message?.includes('quota')) {
      errorMessage = 'API quota exceeded';
    }

    return Response.json({
      valid: false,
      error: errorMessage
    }, { status: 401 });
  }
}
