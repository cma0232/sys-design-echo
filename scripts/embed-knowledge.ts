/**
 * embed-knowledge.ts
 *
 * Reads all markdown files from content/knowledge/, splits them into chunks,
 * generates embeddings using Google text-embedding-004, and stores them in Supabase.
 *
 * Usage:
 *   npm run kb:embed
 *   npm run kb:embed -- --force   (re-embed all, even if already exists)
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import * as fs from "fs";
import * as path from "path";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embedMany } from "ai";
import { createClient } from "@supabase/supabase-js";

// ─── Config ─────────────────────────────────────────────────────────────────

const KNOWLEDGE_DIR = path.join(process.cwd(), "content", "knowledge");
const FORCE = process.argv.includes("--force");

// ─── Clients ─────────────────────────────────────────────────────────────────

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Parse frontmatter ───────────────────────────────────────────────────────

function parseFrontmatter(content: string): {
  meta: Record<string, string | string[]>;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const meta: Record<string, string | string[]> = {};
  for (const line of match[1].split("\n")) {
    const [key, ...rest] = line.split(":");
    if (!key) continue;
    const value = rest.join(":").trim();
    // Parse arrays like [a, b, c]
    if (value.startsWith("[") && value.endsWith("]")) {
      meta[key.trim()] = value
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim());
    } else {
      meta[key.trim()] = value;
    }
  }
  return { meta, body: match[2] };
}

// ─── Split into chunks by ## sections ───────────────────────────────────────

function chunkBySection(body: string, title: string): string[] {
  const sections = body.split(/\n(?=## )/);
  const chunks: string[] = [];

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;
    // Prepend title for context
    chunks.push(`# ${title}\n\n${trimmed}`);
  }

  return chunks.length > 0 ? chunks : [`# ${title}\n\n${body}`];
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const files = fs
    .readdirSync(KNOWLEDGE_DIR)
    .filter((f) => f.endsWith(".md"));

  if (files.length === 0) {
    console.error("No markdown files found in content/knowledge/");
    process.exit(1);
  }

  console.log(`Found ${files.length} knowledge files\n`);

  for (const file of files) {
    const filepath = path.join(KNOWLEDGE_DIR, file);
    const raw = fs.readFileSync(filepath, "utf-8");
    const { meta, body } = parseFrontmatter(raw);
    const title = (meta.title as string) || file.replace(".md", "");
    const tags = (meta.tags as string[]) || [];
    const activeDimensions = (meta.active_dimensions as string[]) || [];
    const source = (meta.source as string) || "manual";

    // Check if already embedded
    if (!FORCE) {
      const { count } = await supabase
        .from("knowledge_embeddings")
        .select("id", { count: "exact", head: true })
        .eq("filename", file);

      if (count && count > 0) {
        console.log(`⏭  Skipping "${title}" (already embedded)`);
        continue;
      }
    } else {
      // Delete existing embeddings for this file
      await supabase
        .from("knowledge_embeddings")
        .delete()
        .eq("filename", file);
    }

    const chunks = chunkBySection(body, title);
    console.log(`📄 ${title} → ${chunks.length} chunks`);

    // Generate embeddings in batch
    const { embeddings } = await embedMany({
      model: google.textEmbeddingModel("gemini-embedding-001"),
      values: chunks,
    });

    // Insert into Supabase
    const rows = chunks.map((content, i) => ({
      filename: file,
      title,
      chunk_index: i,
      content,
      embedding: embeddings[i],
      tags,
      active_dimensions: activeDimensions,
      source,
    }));

    const { error } = await supabase
      .from("knowledge_embeddings")
      .insert(rows);

    if (error) {
      console.error(`   ✗ Insert failed: ${error.message}`);
    } else {
      console.log(`   ✓ Stored ${rows.length} chunks`);
    }

    await new Promise((r) => setTimeout(r, 5000));
  }

  console.log("\n✅ Embedding complete");
}

main().catch(console.error);
