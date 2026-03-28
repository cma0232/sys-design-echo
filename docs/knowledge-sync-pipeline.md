# Knowledge Sync Pipeline

## TL;DR

You write articles in Notion → the system automatically converts them into an AI-searchable format → during interviews, the AI uses this knowledge to ask informed questions and evaluate answers.

---

## Architecture Overview

```
Notion (knowledge base)
    ↓ triggers on any page change
Webhook  /api/webhooks/notion
    ↓ returns 200 immediately, hands off to queue
Inngest (job queue)
    ↓ runs async, auto-retries on failure
sync-notion-page (core logic)
    ↓ fetch content → chunk → generate vectors
Gemini Embedding API
    ↓ store vectors
Supabase (vector database)
    ↓ real-time retrieval during interviews
Interview / Evaluate API
    ↓ inject into system prompt
LLM (Claude / GPT / Gemini)
```

---

## How Each Layer Works

### Notion — Content Editor
- Where you write and organize frontend system design knowledge
- Each article has a `Status` field — only **Ready** articles enter the knowledge base
- Supports dimension tags (Architecture Design, Trade-off Discussion, etc.)
- **Why Notion instead of Markdown files**: content and code should be decoupled. The knowledge base is business content — updating an article shouldn't require a git commit. See the Architecture Decision section below.

### Webhook — Event Listener
- File: `app/api/webhooks/notion/route.ts`
- Notion sends a POST request here whenever a page changes
- Subscribed events: `page.content_updated` (content changed) and `page.property_updated` (properties changed, e.g. Status)
- Does exactly one thing: receive the request → return 200 immediately → hand off to Inngest
- **Why return 200 immediately**: Notion waits for a response and will retry if it times out. Keeping the webhook handler minimal (receive and forward only) and delegating actual work to a job queue is standard webhook design.
- **Security**: Notion uses token-based verification (not HMAC signing). Ownership of the endpoint is confirmed once via a `verification_token` handshake when the webhook is created. Subsequent requests are not signed.

### Inngest — Job Queue
- Runs the sync job asynchronously in the background
- **Why it's needed**: syncing one article involves multiple external APIs (Notion, Gemini, Supabase) and can take 30–60 seconds. Vercel Hobby plan has a 10-second function timeout — running sync inline in the webhook would always fail. Inngest runs the job independently with no timeout constraint.
- **Retry mechanism**: if any step fails (network blip, rate limit, Gemini temporarily unavailable), it automatically retries up to 3 times with no manual intervention. This is also why we don't need a polling cron as a fallback — retries cover the vast majority of failure scenarios.
- **Debounce**: if the same article is edited multiple times within 10 seconds, only one sync runs. Prevents redundant Gemini API calls when you're rapidly editing.
- **Why not polling**: webhooks are event-driven — they fire only when something changes. Polling runs on a fixed schedule regardless of whether anything changed, wasting resources and introducing latency (worst case: wait a full cron cycle). With Inngest's retry mechanism already in place, polling adds no value.
- **Observability**: every execution's steps, duration, and errors are visible at app.inngest.com. Easy to see exactly which article failed and at which step.

### sync-notion-page — Core Sync Logic
- File: `lib/sync-notion-page.ts`
- Shared between two callers: Inngest background job + `npm run notion:sync` CLI script, ensuring consistent behavior
- Steps:
  1. Fetch page content from Notion, convert to Markdown
  2. Split into chunks by `##` headings
  3. Send each chunk to Gemini to generate an embedding (vector)
  4. Delete existing embeddings for this page in Supabase (upsert: delete then insert, keeps data clean)
  5. Write new chunks + vectors to Supabase
  6. Update the `Last Synced` date on the Notion page
- **If Status is not Ready**: delete the page's embeddings from Supabase. e.g. marking an article Archived removes it from the knowledge base immediately.

### Gemini Embedding — Text to Vectors
- Model: `gemini-embedding-001`
- Converts text into a high-dimensional number array (vector). Semantically similar content produces similar vectors.
- This is what enables RAG to do semantic search — searching by meaning, not keywords
- **Why chunk instead of embedding the whole article**: embedding models have token limits; long articles would error out. More importantly, smaller chunks improve retrieval precision — during an interview only the most relevant chunks are injected, not the entire article, avoiding context dilution.
- **Chunking strategy**: split on `##` headings, each chunk is prefixed with the article title (`# Article Title\n\n## Section...`) so every chunk carries full context and isn't semantically orphaned.

### Supabase — Vector Database
- Stores: article title, chunk content, vector, tags, active dimensions
- During interviews, performs vector similarity search against the topic to find the most relevant chunks
- Uses the pgvector extension via the `match_knowledge` RPC function
- **Similarity threshold**: `match_threshold: 0.4` — results below this score are filtered out to avoid injecting irrelevant content
- **Result count**: max 6 chunks per query, balancing knowledge richness against context window usage

### RAG Retrieval — Real-time Injection During Interviews
- File: `lib/rag.ts`
- RAG = Retrieval-Augmented Generation
- When an interview starts, the topic is embedded and used to search Supabase for the 6 most relevant chunks
- Those chunks are injected into the LLM's system prompt under `## RELEVANT KNOWLEDGE BASE`
- **Effect**: the AI interviewer has domain knowledge and can ask specific, informed questions; the evaluator has a concrete reference standard for scoring
- **Why not just put everything in the prompt**: token limits exist, and costs scale with context length. The whole point of RAG is on-demand retrieval — give the LLM only what it needs for this specific topic.

---

## Status Field Behavior

| Status | Behavior |
|--------|----------|
| `Ready` | Auto-embed, write to Supabase, available in interviews |
| `Draft` | Ignored, not synced — use for work-in-progress articles |
| `Archived` | Deleted from Supabase, unavailable in interviews; content preserved in Notion |
| Ready → anything else | Automatically deleted from Supabase |

---

## Architecture Decision: Notion vs Markdown Files

The project originally used local Markdown files (`content/knowledge/*.md`) before migrating to Notion.

### Markdown Advantages
- Zero external dependencies, managed directly in git
- Push and run the embed script once — done
- Developer-friendly

### Markdown Problems
- **Updating content requires touching code**: every new article needs a file change, commit, and push
- **No metadata system**: Status, Tags, Active Dimensions have to be manually maintained as conventions, prone to drift
- **Not accessible to non-technical contributors**: anyone maintaining the knowledge base needs to know git
- **No real-time updates**: requires manually running `npm run notion:sync`

### Why Notion
- **Content and code decoupled**: the knowledge base is product content, not code — it shouldn't live in the repo
- **Rich editing experience**: headings, tables, code blocks, and a database UI for metadata
- **Built-in metadata**: Status, Tags, and dimensions are managed as proper database fields with a UI
- **Webhook automation**: changes go live automatically with no manual steps
- **Platform scalability**: future content contributors don't need to touch the codebase

### Trade-offs
- Two additional external dependencies (Notion API, Inngest), increasing system complexity
- Local development requires running Inngest dev server alongside Next.js
- If Notion goes down, the knowledge base can't be updated (existing content and interviews are unaffected)

### Conclusion
For a product intended to become a platform, **decoupling content management from code is the right architectural call**. Notion as a headless CMS + Supabase as a vector database is a well-established pattern (analogous to Contentful/Sanity + vector DB).

---

## Manual Operations

Under normal conditions everything is fully automatic. For emergencies:

```bash
# Sync all Ready articles (skips unchanged ones)
npm run notion:sync

# Force re-embed all articles (use when chunking logic changes or Supabase data is lost)
npm run notion:sync:force
```

---

## Services and Keys

| Service | Purpose | Env Vars |
|---------|---------|----------|
| Notion | Content source + webhook trigger | `NOTION_API_KEY`, `NOTION_KNOWLEDGE_DB_ID` |
| Supabase | Vector storage and retrieval | `SUPABASE_PROJECT_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Gemini | Generate embeddings | `GOOGLE_API_KEY` |
| Inngest | Job queue, retries, observability | `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` |
