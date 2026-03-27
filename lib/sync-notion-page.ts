/**
 * sync-notion-page.ts
 *
 * Core sync logic for a single Notion page → Supabase embeddings.
 * Used by both the webhook route and the CLI script.
 */

import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { embedMany } from 'ai';
import { createClient } from '@supabase/supabase-js';

function getClients() {
  const notion = new Client({ auth: process.env.NOTION_API_KEY! });
  const n2m = new NotionToMarkdown({ notionClient: notion });
  const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY! });
  const supabase = createClient(
    process.env.SUPABASE_PROJECT_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  return { notion, n2m, google, supabase };
}

function chunkBySection(body: string, title: string): string[] {
  const sections = body.split(/\n(?=## )/);
  const chunks = sections
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `# ${title}\n\n${s}`);
  return chunks.length > 0 ? chunks : [`# ${title}\n\n${body}`];
}

export type SyncResult =
  | { status: 'synced'; chunks: number }
  | { status: 'skipped'; reason: string }
  | { status: 'deleted' }
  | { status: 'error'; message: string };

/**
 * Sync a single Notion page to Supabase.
 * - If status is "Ready": embed and upsert chunks
 * - If status is not "Ready": delete existing embeddings
 */
export async function syncNotionPage(pageId: string): Promise<SyncResult> {
  const { notion, n2m, google, supabase } = getClients();

  // Fetch page metadata
  const page = await notion.pages.retrieve({ page_id: pageId });
  const props = (page as any).properties;
  const status: string = props?.Status?.select?.name ?? '';
  const title: string =
    props?.Title?.title?.[0]?.plain_text ||
    props?.Name?.title?.[0]?.plain_text ||
    'Untitled';

  // If not Ready, remove stale embeddings and bail
  if (status !== 'Ready') {
    await supabase.from('knowledge_embeddings').delete().eq('filename', pageId);
    return { status: 'deleted' };
  }

  // Get page content
  const mdBlocks = await n2m.pageToMarkdown(pageId);
  const { parent: markdown } = n2m.toMarkdownString(mdBlocks);

  if (!markdown.trim()) {
    return { status: 'skipped', reason: 'empty content' };
  }

  const chunks = chunkBySection(markdown, title);

  const activeDimensions: string[] =
    props?.['Active Dimensions']?.multi_select?.map((s: any) => s.name) ?? [];
  const tags: string[] = props?.Tags?.multi_select?.map((s: any) => s.name) ?? [];
  const source: string = props?.Source?.select?.name ?? 'manual';

  // Generate embeddings
  const { embeddings } = await embedMany({
    model: google.textEmbeddingModel('gemini-embedding-001'),
    values: chunks,
  });

  // Upsert: delete old, insert new
  await supabase.from('knowledge_embeddings').delete().eq('filename', pageId);

  const rows = chunks.map((content, i) => ({
    filename: pageId,
    title,
    chunk_index: i,
    content,
    embedding: embeddings[i],
    tags,
    active_dimensions: activeDimensions,
    source,
  }));

  const { error } = await supabase.from('knowledge_embeddings').insert(rows);
  if (error) return { status: 'error', message: error.message };

  // Update Last Synced in Notion
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: { 'Last Synced': { date: { start: new Date().toISOString() } } },
    });
  } catch (_) {}

  return { status: 'synced', chunks: chunks.length };
}
