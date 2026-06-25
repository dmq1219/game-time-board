// Family Hub — Gmail → Supabase sync worker.
//
//   Gmail (Cron poll)  →  Claude Haiku (extract)  →  Supabase import_candidates
//
// Events land as *pending* review candidates; the iPad app shows them in its
// Magic Import inbox (via realtime) for a human to approve. Nothing is written
// to the calendar automatically.
import { getAccessToken, listMessageIds, getMessage } from "./gmail.js";
import { extractEvents } from "./extract.js";
import { fetchMembers, filterUnprocessed, insertCandidate, markProcessed } from "./store.js";

// Mailboxes to scan. Set the GMAIL_ACCOUNTS secret to a JSON array to add more:
//   [{"token":"<refresh>","label":"mom","defaultMember":"noah"}, ...]
// `defaultMember` (a family_members id) is used when the email doesn't clearly
// name a member. Falls back to the single GOOGLE_REFRESH_TOKEN for back-compat.
function getAccounts(env) {
  if (env.GMAIL_ACCOUNTS) {
    try {
      const arr = JSON.parse(env.GMAIL_ACCOUNTS);
      const accounts = (Array.isArray(arr) ? arr : [])
        .map((a, i) => ({
          token: a.token,
          label: a.label || `account${i + 1}`,
          defaultMember: a.defaultMember || ""
        }))
        .filter((a) => a.token);
      if (accounts.length) return accounts;
    } catch (e) {
      console.error("[gmail-sync] GMAIL_ACCOUNTS is not valid JSON:", e.message);
    }
  }
  return env.GOOGLE_REFRESH_TOKEN
    ? [{ token: env.GOOGLE_REFRESH_TOKEN, label: "default", defaultMember: "" }]
    : [];
}

async function runSync(env, { dryRun = false } = {}) {
  const query = env.GMAIL_QUERY || "newer_than:2d";
  const max = Number(env.MAX_MESSAGES || 15);
  const members = await fetchMembers(env);
  const accounts = getAccounts(env);

  let scanned = 0;
  let processed = 0;
  const report = [];

  for (const acct of accounts) {
    const token = await getAccessToken(env, acct.token);
    const allIds = await listMessageIds(token, query, max);
    const ids = await filterUnprocessed(env, allIds);
    scanned += allIds.length;
    processed += ids.length;

    for (const id of ids) {
      const email = await getMessage(token, id);
      if (!email.body) {
        if (!dryRun) await markProcessed(env, id, email.subject, 0);
        report.push({ account: acct.label, id, subject: email.subject, events: 0, note: "no body" });
        continue;
      }
      const events = await extractEvents(env, email, members);
      if (!dryRun) {
        for (const evt of events) {
          // Fall back to this mailbox's default person if the AI couldn't tell.
          if (!evt.memberId && acct.defaultMember) evt.memberId = acct.defaultMember;
          await insertCandidate(env, evt, email);
        }
        await markProcessed(env, id, email.subject, events.length);
      }
      report.push({ account: acct.label, id, subject: email.subject, events: events.length });
    }
  }

  return { accounts: accounts.map((a) => a.label), scanned, processed, dryRun, report };
}

export default {
  // Cron trigger.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      runSync(env).then((r) => console.log("[gmail-sync]", JSON.stringify(r)))
    );
  },

  // Manual trigger: GET /run  (add ?dry=1 to extract without writing).
  // Protected by RUN_TOKEN — pass it as `Authorization: Bearer <token>` or
  // `?token=<token>`. Fails closed: no RUN_TOKEN set ⇒ always 401. The Cron
  // trigger calls scheduled() directly and never hits this HTTP path.
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/run") {
      const provided =
        (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "") ||
        url.searchParams.get("token") ||
        "";
      if (!env.RUN_TOKEN || provided !== env.RUN_TOKEN) {
        return new Response("Unauthorized", { status: 401 });
      }
      try {
        const result = await runSync(env, { dryRun: url.searchParams.get("dry") === "1" });
        return Response.json(result);
      } catch (err) {
        return Response.json({ error: String(err) }, { status: 500 });
      }
    }
    return new Response("Family Hub Gmail sync worker. Cron-driven; /run requires a token.", {
      headers: { "content-type": "text/plain" }
    });
  }
};
