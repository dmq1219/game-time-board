// Supabase REST (PostgREST) helpers. Uses the service-role key server-side.

function headers(env) {
  return {
    apikey: env.SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json"
  };
}

export async function fetchMembers(env) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/family_members?select=id,name`, {
    headers: headers(env)
  });
  if (!res.ok) throw new Error(`members fetch failed: ${res.status}`);
  return res.json();
}

// Given candidate message ids, return the subset NOT already processed.
export async function filterUnprocessed(env, ids) {
  if (!ids.length) return [];
  const list = ids.map((id) => `"${id}"`).join(",");
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/processed_emails?message_id=in.(${list})&select=message_id`,
    { headers: headers(env) }
  );
  if (!res.ok) throw new Error(`processed lookup failed: ${res.status}`);
  const done = new Set((await res.json()).map((r) => r.message_id));
  return ids.filter((id) => !done.has(id));
}

export async function insertCandidate(env, evt, email) {
  const row = {
    title: evt.title,
    date: evt.date,
    start_time: evt.start || null,
    end_time: evt.end || null,
    location: evt.location || "",
    member_id: evt.memberId || null,
    notes: evt.notes || "",
    source: "gmail",
    raw_input: `${email.subject} — ${email.from}`,
    status: "pending"
  };
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/import_candidates`, {
    method: "POST",
    headers: headers(env),
    body: JSON.stringify(row)
  });
  if (!res.ok) throw new Error(`candidate insert failed: ${res.status} ${await res.text()}`);
}

export async function markProcessed(env, messageId, subject, eventsFound) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/processed_emails`, {
    method: "POST",
    headers: { ...headers(env), Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ message_id: messageId, subject, events_found: eventsFound })
  });
  if (!res.ok) throw new Error(`mark processed failed: ${res.status} ${await res.text()}`);
}
