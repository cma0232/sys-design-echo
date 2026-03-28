# Project Reference

Everything you need to pick up the project at any time.

---

## Important URLs

### Product
| Name | URL |
|------|-----|
| Production | https://sys-design-echo.vercel.app |
| GitHub Repo | https://github.com/cma0232/sys-design-echo |

### Service Dashboards
| Service | Dashboard | Purpose |
|---------|-----------|---------|
| Vercel | https://vercel.com/chokochangho/sys-design-echo | Deploys, env vars, logs |
| Supabase | https://supabase.com/dashboard/project/kgjzaskholbygaqyxhic | Database, vector table |
| Inngest | https://app.inngest.com | Job queue, execution logs, retries |
| Notion Knowledge Base | https://www.notion.so/Sys-Design-Echo-33046084de9680c98161d47c2f864aeb | Content management |
| Notion Integration Settings | https://www.notion.so/profile/integrations | Webhook config, API key |

### API Endpoints (Production)
| Endpoint | Purpose |
|----------|---------|
| `/api/webhooks/notion` | Receives Notion webhook events |
| `/api/inngest` | Inngest function registration and invocation |
| `/api/retrieve-context` | RAG retrieval |
| `/api/chat` | Interview conversation |
| `/api/evaluate` | Interview scoring |
| `/api/validate-key` | Validate user API key |

---

## Environment Variables

Actual values are in `.env.local` (not committed to git). Below is where to find each one.

### Local Development (.env.local)

```
# LLM
ANTHROPIC_API_KEY=              # console.anthropic.com
GOOGLE_API_KEY=                 # console.cloud.google.com → Gemini API

# Supabase
SUPABASE_PROJECT_URL=https://kgjzaskholbygaqyxhic.supabase.co
SUPABASE_SERVICE_ROLE_KEY=      # Supabase Dashboard → Settings → API → service_role key

# Notion
NOTION_API_KEY=                 # notion.so/profile/integrations → sys-design-echo → Configuration
NOTION_KNOWLEDGE_DB_ID=a71068eff19f400bb8e4949a032c6ee8
NOTION_RAW_DB_ID=f0b754cd69e0492683ea10a6eb1119ea

# Inngest — local only, do NOT add to Vercel
INNGEST_EVENT_KEY=local
INNGEST_DEV=1
```

### Production (Vercel only)

```
INNGEST_EVENT_KEY=              # app.inngest.com → 🔑 icon (top left) → Default ingest key
INNGEST_SIGNING_KEY=            # app.inngest.com → Apps → Sync new → the signkey... string
```

> **Critical difference**:
> - Local: `INNGEST_EVENT_KEY=local` + `INNGEST_DEV=1`, **do not set** `INNGEST_SIGNING_KEY`
> - Production: real keys, **do not set** `INNGEST_DEV`
> - Setting `INNGEST_SIGNING_KEY` locally puts the SDK into cloud mode — the Dev Server will error with `Expected server kind cloud, got dev`

---

## Local Development

### First-time Setup

```bash
git clone https://github.com/cma0232/sys-design-echo.git
cd sys-design-echo
npm install
# Create .env.local and fill in all variables above
```

### Daily Development

```bash
# Terminal 1 — Next.js (always needed)
npm run dev

# Terminal 2 — Inngest Dev Server (only needed when debugging knowledge sync)
npx inngest-cli@latest dev
```

Open:
- App: http://localhost:3000
- Inngest UI: http://localhost:8288/apps → enter `http://localhost:3000/api/inngest` → Sync

### Testing Knowledge Sync Locally

Manually trigger a sync event (replace pageId with a real Notion page ID):

```bash
curl -X POST http://localhost:8288/e/local \
  -H "Content-Type: application/json" \
  -d '{"name": "notion/page.updated", "data": {"pageId": "your-page-id"}}'
```

**How to find a Notion page ID**: open the page, look at the URL — the ID is after `?p=`:
```
https://www.notion.so/xxx?p=33046084de96813b88c1d3d477bb9e58
                              ↑ this is the pageId
```

---

## Deployment

Push to `main` → Vercel auto-builds and deploys. No manual steps needed.

```bash
git add <specific files>   # avoid git add . to prevent accidentally committing .env.local
git commit -m "your message"
git push origin main
```

Confirm the build succeeded in Vercel Dashboard before doing anything else.

---

## Knowledge Base Management

### Normal Flow (fully automatic)
Set article Status to `Ready` in Notion → auto-embed → Supabase updated → available in interviews immediately

### Manual Operations (emergency only)
```bash
npm run notion:sync          # sync all Ready articles (skips unchanged)
npm run notion:sync:force    # force re-embed everything
```

### Notion Databases
| Database | ID | Purpose |
|----------|----|---------|
| Knowledge Base | `a71068eff19f400bb8e4949a032c6ee8` | Curated knowledge, used by RAG |
| Raw Materials | `f0b754cd69e0492683ea10a6eb1119ea` | Unprocessed notes and interview reports |

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/rag.ts` | RAG retrieval logic |
| `lib/sync-notion-page.ts` | Core sync logic for a single page (shared by Inngest and CLI) |
| `lib/inngest.ts` | Inngest client and event type definitions |
| `lib/inngest-functions.ts` | Inngest background function (sync-notion-page) |
| `app/api/webhooks/notion/route.ts` | Receives Notion webhook events |
| `app/api/inngest/route.ts` | Inngest function registration |
| `scripts/sync-from-notion.ts` | Manual bulk sync script |
| `docs/knowledge-sync-pipeline.md` | Deep-dive on the sync pipeline |
| `docs/project-reference.md` | This document |

---

## Lessons Learned

### Inngest

- **v4 API change**: `createFunction` now takes 2 arguments instead of 3 — the trigger moves into the first argument's `triggers` field:
  ```ts
  // ✅ v4 correct
  inngest.createFunction(
    { id: 'my-fn', triggers: [{ event: 'my/event' }] },
    async ({ event, step }) => { ... }
  )
  ```
- **No real keys needed locally**: `INNGEST_EVENT_KEY=local` + `INNGEST_DEV=1` is all you need
- **Do not set `INNGEST_SIGNING_KEY` locally**: it puts the SDK into cloud mode and breaks the Dev Server sync

### Notion Webhook

- **Notion does not use HMAC signing**: it verifies endpoint ownership once via a `verification_token` handshake at setup time. Subsequent webhook requests are not signed — do not add signature verification to the handler
- **Correct event names**: `page.content_updated` and `page.property_updated` — not `page.updated`
- **Handle the verification challenge before anything else**: no secret exists yet during the handshake, so it must be handled before any auth checks
- **Webhook scope**: events only fire for pages the integration has access to. Make sure the integration is connected to the page via `...` → Connections in Notion

### Vercel

- **Hobby plan has a 10-second function timeout**: this is the direct reason Inngest was introduced — syncing one article (Notion API + Gemini + Supabase) takes 30–60 seconds
- **Environment variable changes require a redeploy to take effect**

### Next.js

- **Multiple lockfile warning**: when a parent directory has its own `package-lock.json`, Next.js may misdetect the workspace root. This is cosmetic and doesn't affect functionality.

---

## Troubleshooting

| Problem | Steps |
|---------|-------|
| Inngest function not triggering | Check Vercel Logs for POST to `/api/webhooks/notion`; verify the Notion Integration is connected to the page |
| Sync error: `supabaseUrl is required` | `SUPABASE_PROJECT_URL` not set in Vercel env vars |
| Sync error: `API token is invalid` | `NOTION_API_KEY` not set in Vercel env vars |
| Local Inngest error: `Expected server kind cloud, got dev` | Remove `INNGEST_SIGNING_KEY` from `.env.local`; confirm `INNGEST_DEV=1` is set; restart `npm run dev` |
| Notion changes not triggering webhook | Check that the sys-design-echo integration appears under `...` → Connections on the page |
| Vercel build TypeScript error | Run `npx tsc --noEmit` locally to catch errors before pushing |
