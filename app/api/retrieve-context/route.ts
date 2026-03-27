'use server';

import { retrieveKnowledge } from '@/lib/rag';

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    if (!topic) return new Response('Missing topic', { status: 400 });

    const context = await retrieveKnowledge(topic);
    return Response.json({ context });
  } catch (error: any) {
    console.error('RAG retrieve error:', error);
    // Non-fatal — interview can still proceed without context
    return Response.json({ context: '' });
  }
}
