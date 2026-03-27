/**
 * sync-from-notion.ts
 *
 * Pulls "Ready" pages from the Notion Knowledge Base,
 * re-generates embeddings for updated pages, and syncs to Supabase.
 *
 * Usage:
 *   npm run notion:sync           — only sync pages updated since last sync
 *   npm run notion:sync -- --force — re-sync all pages
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { embedMany } from 'ai';
import { createClient } from '@supabase/supabase-js';

const notion = new Client({ auth: process.env.NOTION_API_KEY! });
const n2m = new NotionToMarkdown({ notionClient: notion });
const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY! });
const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DB_ID = process.env.NOTION_KNOWLEDGE_DB_ID!;
const FORCE = process.argv.includes('--force');

// ─── Chunk markdown by ## sections ───────────────────────────────────────────

function chunkBySection(body: string, title: string): string[] {
  const sections = body.split(/\n(?=## )/);
  const chunks = sections
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `# ${title}\n\n${s}`);
  return chunks.length > 0 ? chunks : [`# ${title}\n\n${body}`];
}

// ─── Get all Ready pages ──────────────────────────────────────────────────────

async function getReadyPages() {
  const pages: any[] = [];
  let cursor: string | undefined;

  do {
    const res = await notion.databases.query({
      database_id: DB_ID,
      filter: { property: 'Status', select: { equals: 'Ready' } },
      start_cursor: cursor,
      page_size: 100,
    });
    pages.push(...res.results);
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return pages;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!DB_ID) {
    console.error('NOTION_KNOWLEDGE_DB_ID is not set in .env.local');
    process.exit(1);
  }

  console.log('Fetching Ready pages from Notion...');
  const pages = await getReadyPages();
  console.log(`Found ${pages.length} pages\n`);

  for (const page of pages) {
    const props = (page as any).properties;
    const title = props?.Name?.title?.[0]?.plain_text || 'Untitled';
    const lastEdited = new Date((page as any).last_edited_time);
    const pageId = page.id;

    // Check if already synced and not changed
    if (!FORCE) {
      const { data } = await supabase
        .from('knowledge_embeddings')
        .select('created_at')
        .eq('filename', pageId)
        .limit(1);

      if (data && data.length > 0) {
        const lastSynced = new Date(data[0].created_at);
        if (lastSynced > lastEdited) {
          console.log(`⏭  Skipping "${title}" (no changes)`);
          continue;
        }
      }
    } else {
      await supabase.from('knowledge_embeddings').delete().eq('filename', pageId);
    }

    // Get page content as markdown
    console.log(`📄 Syncing: ${title}`);
    const mdBlocks = await n2m.pageToMarkdown(pageId);
    const { parent: markdown } = n2m.toMarkdownString(mdBlocks);

    if (!markdown.trim()) {
      console.log('   ⚠ Empty content, skipping');
      continue;
    }

    const chunks = chunkBySection(markdown, title);

    // Get metadata from page properties
    const activeDimensions: string[] =
      props?.['Active Dimensions']?.multi_select?.map((s: any) => s.name) || [];
    const tags: string[] =
      props?.Tags?.multi_select?.map((s: any) => s.name) || [];
    const source: string = props?.Source?.select?.name || 'manual';

    // Generate embeddings
    const { embeddings } = await embedMany({
      model: google.textEmbeddingModel('gemini-embedding-001'),
      values: chunks,
    });

    // Delete old embeddings for this page
    await supabase.from('knowledge_embeddings').delete().eq('filename', pageId);

    // Insert new embeddings
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

    if (error) {
      console.error(`   ✗ Insert failed: ${error.message}`);
    } else {
      console.log(`   ✓ ${chunks.length} chunks synced`);
    }

    // Update Last Synced in Notion
    try {
      await notion.pages.update({
        page_id: pageId,
        properties: { 'Last Synced': { date: { start: new Date().toISOString() } } },
      });
    } catch (_) {}

    await new Promise((r) => setTimeout(r, 5000)); // respect Google embedding rate limit
  }

  console.log('\n✅ Sync complete');
}

main().catch(console.error);
