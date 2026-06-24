# Family Hub — Gmail → Supabase sync worker

A Cloudflare Worker that, on a schedule, reads your Gmail, extracts events with
DeepSeek, and writes them to Supabase as **pending review candidates**. The iPad
app shows them in its Magic Import inbox (in real time) for a human to approve —
nothing hits the calendar automatically.

```
Gmail  ──(Cron poll, twice a day)──▶  Cloudflare Worker
                                          │  DeepSeek extracts events
                                          ▼
                                   Supabase import_candidates (status: pending)
                                          │  Supabase realtime
                                          ▼
                          iPad app → 邮件导入 inbox → you approve → calendar
```

Why polling (not Gmail push): it matches "定时同步", needs no Pub/Sub topic, and
nothing to renew. Current cron is `0 3,15 * * *` (twice daily, ≈8am/8pm Pacific);
tune `crons` in `wrangler.toml` for more/less frequency.

## Cost (all within free tiers for a household)

| Service | Free allowance | This workload |
| --- | --- | --- |
| Cloudflare Workers | 100k requests/day | ~96 cron runs/day |
| Gmail API | free | a few calls/run |
| DeepSeek (deepseek-chat) | pay-as-you-go | well under $0.01 per email; pennies/month |
| Supabase | 500MB + realtime | tiny |

The only non-free piece is the DeepSeek API (a few cents a month at household volume).

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

### 2. DeepSeek API key

[platform.deepseek.com](https://platform.deepseek.com) → API keys → create one
(`sk-…`). `deepseek-chat` is OpenAI-compatible and costs a fraction of a cent
per email. (To use a different OpenAI-compatible provider, set `DEEPSEEK_BASE_URL`
and `DEEPSEEK_MODEL` accordingly.)

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
npx wrangler secret put DEEPSEEK_API_KEY
npx wrangler secret put SUPABASE_SERVICE_KEY
npx wrangler secret put RUN_TOKEN   # any long random string; protects /run

npx wrangler deploy
```

`SUPABASE_URL`, `DEEPSEEK_MODEL`, `GMAIL_QUERY`, and `MAX_MESSAGES` live in
[wrangler.toml](wrangler.toml) — tune `GMAIL_QUERY` to your school's senders.

## Test it

```bash
# /run requires the RUN_TOKEN (header or ?token=). The Cron trigger needs no token.
TOKEN=...   # the value you set for RUN_TOKEN

# Dry run — extracts and reports, writes nothing:
curl -H "Authorization: Bearer $TOKEN" \
  "https://family-hub-gmail-sync.<your-subdomain>.workers.dev/run?dry=1"

# Real run — writes pending candidates to Supabase:
curl -H "Authorization: Bearer $TOKEN" \
  "https://family-hub-gmail-sync.<your-subdomain>.workers.dev/run"
```

Then open the app's **Import** tab — new candidates appear in the Gmail inbox
section with a nav badge. Watch live logs with `npx wrangler tail`.

## Adding more mailboxes (e.g. mom's) + who an event is "for"

**Each Gmail account must authorise once** — there's no way around its owner
logging in. To add mom's inbox:

1. In Google Cloud → **OAuth consent screen**, add mom's address as a **Test user**.
2. Mom mints her refresh token (logged into HER Google account):
   ```bash
   cd worker
   GOOGLE_CLIENT_ID=...apps.googleusercontent.com \
   GOOGLE_CLIENT_SECRET=... \
   npm run get-token            # mom approves read-only Gmail in the browser
   ```
3. Set the **`GMAIL_ACCOUNTS`** secret to a JSON array of all mailboxes:
   ```bash
   npx wrangler secret put GMAIL_ACCOUNTS
   # paste, on one line:
   # [{"token":"<dad-refresh>","label":"maoquandeng","defaultMember":""},
   #  {"token":"<mom-refresh>","label":"mom","defaultMember":"noah"}]
   ```
   The worker scans every listed mailbox each run. If `GMAIL_ACCOUNTS` is unset it
   falls back to the single `GOOGLE_REFRESH_TOKEN` (so existing setups keep working).

**Who is each event for?** Two layers:
- The extractor is given your family roster (`id = name (role)`) and assigns
  `memberId` when the email clearly names a member (e.g. "Edward's recital" →
  Edward). This already works for one or many mailboxes.
- When the email doesn't name anyone, the mailbox's **`defaultMember`** (a
  `family_members` id) is used — handy if a mailbox mostly concerns one child.
- You can always reassign in the app's review card before approving.

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
  school domains/labels to cut model calls. A Gmail label + filter is ideal:
  label school mail, then set `GMAIL_QUERY = "newer_than:2d label:school"`.
- **Model / provider:** `DEEPSEEK_MODEL` (defaults to `deepseek-chat`); point
  `DEEPSEEK_BASE_URL` at any OpenAI-compatible endpoint to swap providers.
