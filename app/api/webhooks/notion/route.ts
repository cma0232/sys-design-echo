/**
 * POST /api/webhooks/notion
 *
 * Receives Notion webhook events and enqueues a background sync job via Inngest.
 * Returns 200 immediately — actual sync runs asynchronously with retries.
 *
 * Security: Notion uses token-based verification (not HMAC signing).
 * Endpoint was verified via the verification_token handshake during setup.
 */

import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest';

const KB_DB_ID = process.env.NOTION_KNOWLEDGE_DB_ID!;

export async function POST(req: NextRequest) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Verification challenge sent once when webhook is created
  if (payload.verification_token) {
    console.log('[notion-webhook] verification_token:', payload.verification_token);
    return NextResponse.json({ verification_token: payload.verification_token });
  }

  const { type, entity } = payload;

  if (!['page.content_updated', 'page.property_updated'].includes(type)) {
    return NextResponse.json({ ignored: true });
  }

  const pageId: string | undefined = entity?.id;
  if (!pageId) {
    return NextResponse.json({ error: 'No page ID in payload' }, { status: 400 });
  }

  // Ignore pages outside the Knowledge Base database
  const parentDbId: string | undefined = entity?.parent?.database_id ?? entity?.parent_database_id;
  if (parentDbId && parentDbId.replace(/-/g, '') !== KB_DB_ID.replace(/-/g, '')) {
    return NextResponse.json({ ignored: true, reason: 'not in Knowledge Base' });
  }

  // Enqueue background job — returns instantly, Inngest handles retry & timeout
  await inngest.send({ name: 'notion/page.updated', data: { pageId } });

  return NextResponse.json({ ok: true, queued: pageId });
}
