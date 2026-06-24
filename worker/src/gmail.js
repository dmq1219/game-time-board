// Gmail REST helpers. Auth is OAuth2 with a long-lived refresh token that the
// Worker exchanges for a short-lived access token on each run.

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://gmail.googleapis.com/gmail/v1/users/me";

export async function getAccessToken(env) {
  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: env.GOOGLE_REFRESH_TOKEN,
    grant_type: "refresh_token"
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!res.ok) throw new Error(`Gmail token refresh failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.access_token;
}

export async function listMessageIds(token, query, max) {
  const url = `${API}/messages?q=${encodeURIComponent(query)}&maxResults=${max}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Gmail list failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return (json.messages || []).map((m) => m.id);
}

// URL-safe base64 -> UTF-8 string.
function decodeB64Url(data) {
  const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

// Strip HTML tags as a fallback when there's no text/plain part.
function htmlToText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Walk the MIME tree collecting the best body text.
function extractBody(payload) {
  let plain = "";
  let html = "";
  const walk = (part) => {
    if (!part) return;
    const mime = part.mimeType || "";
    if (mime === "text/plain" && part.body?.data) plain += decodeB64Url(part.body.data);
    else if (mime === "text/html" && part.body?.data) html += decodeB64Url(part.body.data);
    (part.parts || []).forEach(walk);
  };
  walk(payload);
  if (plain.trim()) return plain.trim();
  if (html.trim()) return htmlToText(html);
  return "";
}

export async function getMessage(token, id) {
  const res = await fetch(`${API}/messages/${id}?format=full`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Gmail get failed: ${res.status} ${await res.text()}`);
  const msg = await res.json();
  const headers = msg.payload?.headers || [];
  const header = (name) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
  return {
    id,
    subject: header("Subject"),
    from: header("From"),
    date: header("Date"),
    body: extractBody(msg.payload)
  };
}
