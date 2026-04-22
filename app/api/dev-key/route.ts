import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }

  return NextResponse.json({
    anthropic: process.env.ANTHROPIC_API_KEY || null,
    openai: process.env.OPENAI_API_KEY || null,
    google: process.env.GOOGLE_API_KEY || null,
  });
}
