# Family Hub — Gmail → Supabase sync worker

A Cloudflare Worker that, on a schedule, reads your Gmail, extracts events with
Claude, and writes them to Supabase as **pending review candidates**. The iPad
app shows them in its Magic Import inbox (in real time) for a human to approve —
nothing hits the calendar automatically.

```
Gmail  ──(Cron poll, every 15 min)──▶  Cloudflare Worker
                                          │  Claude Haiku extracts events
                                          ▼
                                   Supabase import_candidates (status: pending)
                                          │  Supabase realtime
                                          ▼
                              iPad app → Import inbox → you approve → calendar
```

Why polling (not Gmail push): it matches "定时同步", needs no Pub/Sub topic, and
nothing to renew. Trade-off: up to ~15 min latency (tune the cron).

## Cost (all within free tiers for a household)

| Service | Free allowance | This workload |
| --- | --- | --- |
| Cloudflare Workers | 100k requests/day | ~96 cron runs/day |
| Gmail API | free | a few calls/run |
| Claude Haiku 4.5 | pay-as-you-go | ~$0.01 per email parsed; pennies/month |
| Supabase | 500MB + realtime | tiny |

The only non-free piece is the Claude API (a few cents a month at household volume).

## One-time setup

### 1. Google Cloud (Gmail access)

1. [console.cloud.google.com](https://console.cloud.google.com) → create a project.
2. **APIs & Services → Library →** enable **Gmail API**.
3. **OAuth consent screen →** External → add yourself as a **Test user**
   (keeps it in testing mode; no Google verification needed for personal use).
4. **Credentials → Create credentials → OAuth client ID → Desktop app.**
   Note the **Client ID** and **Client secret**.
5. Mint a refresh token locally:
   ```bash
   cd worker
   npm install
   GOOGLE_CLIENT_ID=...apps.googleusercontent.com \
   GOOGLE_CLIENT_SECRET=... \
   npm run get-token
   ```
   Approve read-only Gmail access in the browser; copy the printed refresh token.

### 2. Claude API key

[console.anthropic.com](https://console.anthropic.com) → API Keys → create one
(`sk-ant-…`). Haiku usage is about a cent per email.

### 3. Supabase service-role key

Supabase dashboard → your project → **Settings → API → service_role** key
(server-side only — keep it secret).

### 4. Deploy

```bash
cd worker
npm install
npx wrangler login                 # one-time Cloudflare auth

# secrets (never committed)
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GOOGLE_REFRESH_TOKEN
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put SUPABASE_SERVICE_KEY

npx wrangler deploy
```

`SUPABASE_URL`, `ANTHROPIC_MODEL`, `GMAIL_QUERY`, and `MAX_MESSAGES` live in
[wrangler.toml](wrangler.toml) — tune `GMAIL_QUERY` to your school's senders.

## Test it

```bash
# Dry run — extracts and reports, writes nothing:
curl "https://family-hub-gmail-sync.<your-subdomain>.workers.dev/run?dry=1"

# Real run — writes pending candidates to Supabase:
curl "https://family-hub-gmail-sync.<your-subdomain>.workers.dev/run"
```

Then open the app's **Import** tab — new candidates appear in the Gmail inbox
section with a nav badge. Watch live logs with `npx wrangler tail`.

## How it stays correct

- **Review before write:** events are `pending` candidates, never auto-added.
- **Untrusted email:** the extractor treats email text as data and ignores any
  instructions inside it (prompt-injection safe).
- **No duplicates:** every handled message id is recorded in `processed_emails`,
  so re-runs skip it. The app additionally flags same-day/same-title/same-time
  candidates as "possible duplicate".
- **Dates resolved to the email's received date**, so "Thursday" or "tomorrow"
  becomes an absolute date.

## Tuning

- **Latency vs cost:** change `crons` in `wrangler.toml` (e.g. `*/5 * * * *`).
- **What gets scanned:** `GMAIL_QUERY` (Gmail search syntax). Narrow it to your
  school domains/labels to cut Claude calls. A Gmail label + filter is ideal:
  label school mail, then set `GMAIL_QUERY = "newer_than:2d label:school"`.
- **Model:** `ANTHROPIC_MODEL` (defaults to `claude-haiku-4-5`).
