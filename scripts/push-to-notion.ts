/**
 * push-to-notion.ts
 *
 * One-time migration: pushes existing content/knowledge/*.md files into
 * the Notion Knowledge Base database so you can edit them there going forward.
 *
 * Usage: npm run notion:push
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as fs from 'fs';
import * as path from 'path';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY! });
const DB_ID = process.env.NOTION_KNOWLEDGE_DB_ID!;
const KNOWLEDGE_DIR = path.join(process.cwd(), 'content', 'knowledge');

// ─── Frontmatter parser ───────────────────────────────────────────────────────

function parseFrontmatter(content: string) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {} as Record<string, any>, body: content };

  const meta: Record<string, any> = {};
  for (const line of match[1].split('\n')) {
    const [key, ...rest] = line.split(':');
    if (!key) continue;
    const value = rest.join(':').trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      meta[key.trim()] = value.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
    } else {
      meta[key.trim()] = value;
    }
  }
  return { meta, body: match[2] };
}

// ─── Markdown → Notion blocks (simple conversion) ────────────────────────────

function markdownToBlocks(markdown: string): any[] {
  const blocks: any[] = [];
  const lines = markdown.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('### ')) {
      blocks.push({ object: 'block', type: 'heading_3', heading_3: { rich_text: [{ type: 'text', text: { content: line.slice(4).trim() } }] } });
    } else if (line.startsWith('## ')) {
      blocks.push({ object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: line.slice(3).trim() } }] } });
    } else if (line.startsWith('# ')) {
      blocks.push({ object: 'block', type: 'heading_1', heading_1: { rich_text: [{ type: 'text', text: { content: line.slice(2).trim() } }] } });
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({ object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: line.slice(2).trim() } }] } });
    } else if (line.trim() === '---') {
      blocks.push({ object: 'block', type: 'divider', divider: {} });
    } else if (line.trim()) {
      // Paragraph — chunk to max 2000 chars
      const chunks = line.match(/.{1,2000}/g) || [line];
      for (const chunk of chunks) {
        blocks.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: chunk } }] } });
      }
    }

    i++;
  }

  return blocks;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!DB_ID) {
    console.error('NOTION_KNOWLEDGE_DB_ID is not set in .env.local');
    process.exit(1);
  }

  const files = fs.readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith('.md'));
  console.log(`Pushing ${files.length} files to Notion Knowledge Base...\n`);

  for (const file of files) {
    const raw = fs.readFileSync(path.join(KNOWLEDGE_DIR, file), 'utf-8');
    const { meta, body } = parseFrontmatter(raw);
    const title = (meta.title as string) || file.replace('.md', '');
    const source = ((meta.source as string) || 'YouTube');
    const activeDimensions = (meta.active_dimensions as string[]) || [];
    const tags = (meta.tags as string[]) || [];

    // Build properties
    const properties: any = {
      Name: { title: [{ text: { content: title } }] },
      Status: { select: { name: 'Ready' } },
      Source: { select: { name: source.charAt(0).toUpperCase() + source.slice(1) } },
    };

    if (activeDimensions.length > 0) {
      properties['Active Dimensions'] = {
        multi_select: activeDimensions.map((d) => ({ name: d })),
      };
    }

    if (tags.length > 0) {
      properties['Tags'] = {
        multi_select: tags.slice(0, 10).map((t) => ({ name: t.slice(0, 100) })),
      };
    }

    // Create page
    const page = await notion.pages.create({
      parent: { database_id: DB_ID },
      properties,
    });

    // Add content blocks in batches of 100
    const blocks = markdownToBlocks(body);
    for (let i = 0; i < blocks.length; i += 100) {
      await notion.blocks.children.append({
        block_id: page.id,
        children: blocks.slice(i, i + 100) as any,
      });
    }

    console.log(`✓ ${title}`);
    await new Promise((r) => setTimeout(r, 400)); // avoid rate limits
  }

  console.log('\n✅ All files pushed to Notion');
}

main().catch(console.error);
