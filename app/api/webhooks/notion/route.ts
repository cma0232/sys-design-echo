/**
 * POST /api/webhooks/notion
 *
 * Receives Notion webhook events and enqueues a background sync job via Inngest.
 * Returns 200 immediately — actual sync runs asynchronously with retries.
 *
 * Security: signature verified via HMAC-SHA256 using NOTION_WEBHOOK_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { inngest } from '@/lib/inngest';

const KB_DB_ID = process.env.NOTION_KNOWLEDGE_DB_ID!;

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.NOTION_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = 'v0=' + createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-notion-signature');

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Verification challenge must be handled before signature check
  // (no signing secret exists yet at this point)
  if (payload.verification_token) {
    return NextResponse.json({ verification_token: payload.verification_token });
  }

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
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
