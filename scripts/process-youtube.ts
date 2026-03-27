/**
 * process-youtube.ts
 *
 * Extracts transcripts from a list of YouTube videos and uses AI to
 * structure them into knowledge base markdown files under content/knowledge/.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/process-youtube.ts
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/process-youtube.ts --id cGiSr0MilsI
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { YoutubeTranscript } from "youtube-transcript";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import * as fs from "fs";
import * as path from "path";

// ─── Playlist videos ────────────────────────────────────────────────────────

const VIDEOS = [
  { id: "cGiSr0MilsI", title: "Core Web Vitals for Frontend Engineers" },
  { id: "dAE-Zr62JFA", title: "Real-Time Collaboration: OT vs CRDT Explained" },
  { id: "Z6c7txCqsu8", title: "Reordering Lists at Scale" },
  { id: "HnsB4T1ZuTA", title: "Offline Support Explained" },
  { id: "E_LNT_ZEet0", title: "Designing a Kanban Board (Interview)" },
  { id: "Ot_BjRrLqhA", title: "Frontend Looks Easy — Until You Build a Real System" },
  { id: "3tgPZCRHsvg", title: "Pragmatic Drag and Drop in React — Accessibility Essentials" },
  { id: "pnLRuGL-ezY", title: "Server-Side Rendering" },
  { id: "009KFjEpq8A", title: "Pagination (Offset, Cursor, Infinite Scroll)" },
  { id: "9WAmKwUMrZ4", title: "7 Common Mistakes in Frontend System Design" },
  { id: "0iHtf5rV_QI", title: "Rendering Strategies (SSR/CSR/SSG)" },
  { id: "fZ4zKgVXOP4", title: "Preload vs. Prefetch" },
  { id: "Q9zSHpqrHsk", title: "Code Splitting and Lazy Loading" },
  { id: "VtOY_LoFOGY", title: "Real-time Updates" },
  { id: "cypK50wBCZs", title: "Optimistic Updates" },
  { id: "dViKLPWZrSY", title: "Virtualization Explained" },
  { id: "h5sDunwpPTg", title: "Normalization Explained" },
  { id: "NDr9Mp9Rxh0", title: "How to Design a Twitter/LinkedIn Feed (Interview)" },
  { id: "Sky0Ln0hrZs", title: "How to Design a Typeahead Component (Interview)" },
  { id: "ojFsLG4TkUA", title: "CCDAO Framework for SD Interview" },
];

// ─── Rubric dimensions (for AI to tag each entry) ───────────────────────────

const RUBRIC_DIMENSIONS = [
  "Problem Framing",
  "Architecture Design",
  "Trade-off Discussion",
  "Communication & Drive",
  "Performance Awareness",
  "Accessibility (A11y)",
  "Offline / PWA",
  "Real-time / Data Sync",
  "Internationalization (i18n)",
  "Security",
];

// ─── AI processing prompt ────────────────────────────────────────────────────

function buildPrompt(title: string, transcript: string): string {
  return `You are building a knowledge base for a Frontend System Design mock interview platform.

Below is the transcript of a YouTube video titled: "${title}"

Your task is to extract structured knowledge from this transcript and format it as a knowledge base entry in markdown.

The output must follow this exact structure:

---
title: <concise topic title>
source: youtube
source_title: ${title}
active_dimensions: [comma-separated list from: ${RUBRIC_DIMENSIONS.join(", ")}]
tags: [comma-separated topic tags]
---

## Overview
<2-3 sentences summarizing what this topic is about and why it matters in frontend SD interviews>

## Core Concepts
<bullet list of the key concepts covered>

## Architecture / Approaches
<describe the main design approaches or patterns discussed, with trade-offs for each>

## Key Trade-offs
<explicit trade-off pairs discussed, e.g. "Polling vs WebSocket: polling is simpler but less efficient...">

## Common Interview Questions
<5-8 questions an interviewer might ask on this topic, derived from the video content>

## Evaluation Signals
<what distinguishes a strong answer from a weak one on this topic>

---

Rules:
- Only include active_dimensions that are genuinely relevant to this topic
- Keep each section concise but dense with useful information
- Interview questions should be specific, not generic
- Do NOT invent information not present in the transcript

TRANSCRIPT:
${transcript.slice(0, 12000)}`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fetchTranscript(videoId: string): Promise<string> {
  const items = await YoutubeTranscript.fetchTranscript(videoId);
  return items.map((i) => i.text).join(" ");
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required");
    process.exit(1);
  }

  const anthropic = createAnthropic({ apiKey });

  // Allow filtering to a single video: --id <videoId>
  const idFlag = process.argv.indexOf("--id");
  const targetId = idFlag !== -1 ? process.argv[idFlag + 1] : null;
  const videos = targetId ? VIDEOS.filter((v) => v.id === targetId) : VIDEOS;

  if (targetId && videos.length === 0) {
    console.error(`Video ID "${targetId}" not found in the playlist.`);
    process.exit(1);
  }

  const outputDir = path.join(process.cwd(), "content", "knowledge");

  for (const video of videos) {
    const outputFile = path.join(outputDir, `${slugify(video.title)}.md`);

    if (fs.existsSync(outputFile)) {
      console.log(`⏭  Skipping "${video.title}" (already processed)`);
      continue;
    }

    console.log(`\n📥 Fetching transcript: ${video.title}`);
    let transcript: string;
    try {
      transcript = await fetchTranscript(video.id);
    } catch (err) {
      console.error(`   ✗ Failed to fetch transcript: ${err}`);
      continue;
    }

    console.log(`   ✓ Got ${transcript.split(" ").length} words`);
    console.log(`🤖 Processing with AI...`);

    try {
      const { text } = await generateText({
        model: anthropic("claude-haiku-4-5-20251001"),
        prompt: buildPrompt(video.title, transcript),
        maxOutputTokens: 2000,
        temperature: 0.3,
      });

      fs.writeFileSync(outputFile, text, "utf-8");
      console.log(`   ✓ Saved → content/knowledge/${slugify(video.title)}.md`);
    } catch (err) {
      console.error(`   ✗ AI processing failed: ${err}`);
    }

    // Avoid rate limiting
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("\n✅ Done");
}

main().catch(console.error);
