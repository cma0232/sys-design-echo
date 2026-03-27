/**
 * setup-notion.ts
 *
 * Creates two Notion databases under the parent page:
 * 1. Knowledge Base — polished topic pages (RAG reads this)
 * 2. Raw Materials — unprocessed 面经 and notes
 *
 * Usage: npm run notion:setup
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY! });
const PARENT_PAGE_ID = '33046084de9680c98161d47c2f864aeb';

async function createKnowledgeBase() {
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: PARENT_PAGE_ID },
    title: [{ type: 'text', text: { content: 'Knowledge Base' } }],
    properties: {
      Title: { title: {} },
      Status: {
        select: {
          options: [
            { name: 'Draft', color: 'yellow' },
            { name: 'Ready', color: 'green' },
            { name: 'Archived', color: 'gray' },
          ],
        },
      },
      Source: {
        select: {
          options: [
            { name: 'YouTube', color: 'red' },
            { name: 'Discord', color: 'purple' },
            { name: 'Manual', color: 'blue' },
          ],
        },
      },
      'Active Dimensions': {
        multi_select: {
          options: [
            { name: 'Problem Framing', color: 'blue' },
            { name: 'Architecture Design', color: 'green' },
            { name: 'Trade-off Discussion', color: 'orange' },
            { name: 'Communication & Drive', color: 'pink' },
            { name: 'Performance Awareness', color: 'yellow' },
            { name: 'Accessibility (A11y)', color: 'purple' },
            { name: 'Offline / PWA', color: 'gray' },
            { name: 'Real-time / Data Sync', color: 'red' },
            { name: 'Internationalization (i18n)', color: 'brown' },
            { name: 'Security', color: 'default' },
          ],
        },
      },
      Tags: { multi_select: { options: [] } },
      'Last Synced': { date: {} },
    },
  });

  return db.id;
}

async function createRawMaterials() {
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: PARENT_PAGE_ID },
    title: [{ type: 'text', text: { content: 'Raw Materials' } }],
    properties: {
      Title: { title: {} },
      Source: {
        select: {
          options: [
            { name: 'Discord', color: 'purple' },
            { name: 'Article', color: 'blue' },
            { name: 'Note', color: 'green' },
            { name: 'Other', color: 'gray' },
          ],
        },
      },
      Status: {
        select: {
          options: [
            { name: 'Unprocessed', color: 'red' },
            { name: 'Processing', color: 'yellow' },
            { name: 'Done', color: 'green' },
          ],
        },
      },
    },
  });

  return db.id;
}

async function main() {
  console.log('Creating Notion databases...\n');

  const kbId = await createKnowledgeBase();
  console.log('✓ Knowledge Base created');
  console.log(`  ID: ${kbId}`);

  const rawId = await createRawMaterials();
  console.log('✓ Raw Materials created');
  console.log(`  ID: ${rawId}`);

  console.log('\nAdd these to your .env.local:');
  console.log(`NOTION_KNOWLEDGE_DB_ID=${kbId}`);
  console.log(`NOTION_RAW_DB_ID=${rawId}`);
}

main().catch(console.error);
