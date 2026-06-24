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

async function runSync(env, { dryRun = false } = {}) {
  const token = await getAccessToken(env);
  const query = env.GMAIL_QUERY || "newer_than:2d";
  const max = Number(env.MAX_MESSAGES || 15);

  const allIds = await listMessageIds(token, query, max);
  const ids = await filterUnprocessed(env, allIds);
  const members = await fetchMembers(env);

  const report = [];
  for (const id of ids) {
    const email = await getMessage(token, id);
    if (!email.body) {
      if (!dryRun) await markProcessed(env, id, email.subject, 0);
      report.push({ id, subject: email.subject, events: 0, note: "no body" });
      continue;
    }
    const events = await extractEvents(env, email, members);
    if (!dryRun) {
      for (const evt of events) await insertCandidate(env, evt, email);
      await markProcessed(env, id, email.subject, events.length);
    }
    report.push({ id, subject: email.subject, events: events.length });
  }

  return { scanned: allIds.length, processed: ids.length, dryRun, report };
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
