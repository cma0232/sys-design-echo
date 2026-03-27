/**
 * sync-from-notion.ts
 *
 * Bulk sync: pulls all "Ready" pages from Notion Knowledge Base and syncs to Supabase.
 * Uses the same syncNotionPage() core as the webhook route.
 *
 * Usage:
 *   npm run notion:sync           — only sync pages updated since last sync
 *   npm run notion:sync -- --force — re-sync all pages
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Client } from '@notionhq/client';
import { createClient } from '@supabase/supabase-js';
import { syncNotionPage } from '../lib/sync-notion-page';

const notion = new Client({ auth: process.env.NOTION_API_KEY! });
const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DB_ID = process.env.NOTION_KNOWLEDGE_DB_ID!;
const FORCE = process.argv.includes('--force');

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
    const title =
      props?.Title?.title?.[0]?.plain_text ||
      props?.Name?.title?.[0]?.plain_text ||
      'Untitled';
    const pageId = page.id;

    // Skip pages that haven't changed (unless --force)
    if (!FORCE) {
      const lastEdited = new Date((page as any).last_edited_time);
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
    }

    console.log(`📄 Syncing: ${title}`);
    const result = await syncNotionPage(pageId);

    if (result.status === 'synced') {
      console.log(`   ✓ ${result.chunks} chunks synced`);
    } else if (result.status === 'skipped') {
      console.log(`   ⚠ Skipped: ${result.reason}`);
    } else if (result.status === 'error') {
      console.error(`   ✗ Error: ${result.message}`);
    }

    await new Promise((r) => setTimeout(r, 5000)); // respect Google embedding rate limit
  }

  console.log('\n✅ Sync complete');
}

main().catch(console.error);
