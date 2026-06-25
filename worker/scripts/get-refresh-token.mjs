#!/usr/bin/env node
// One-time: mint a Gmail refresh token via the OAuth loopback flow.
//
//   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/get-refresh-token.mjs
//
// Requires a Google Cloud OAuth client of type "Desktop app" with the Gmail API
// enabled. Opens a browser, you approve read-only Gmail access, and the script
// prints the refresh token to paste into:  wrangler secret put GOOGLE_REFRESH_TOKEN
import http from "node:http";
import { exec } from "node:child_process";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const PORT = 53682;
const REDIRECT = `http://127.0.0.1:${PORT}`;
const SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the environment first.");
  process.exit(1);
}

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent"
  });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT);
  const code = url.searchParams.get("code");
  if (!code) {
    res.writeHead(400).end("No code in callback.");
    return;
  }
  res.writeHead(200, { "Content-Type": "text/html" }).end(
    "<h2>Done. You can close this tab and return to the terminal.</h2>"
  );

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT,
        grant_type: "authorization_code"
      })
    });
    const json = await tokenRes.json();
    if (json.refresh_token) {
      console.log("\n✅ Refresh token (store as the GOOGLE_REFRESH_TOKEN secret):\n");
      console.log(json.refresh_token + "\n");
    } else {
      console.error("\n⚠️  No refresh_token returned. Response:\n", json);
      console.error(
        "If you've authorized before, remove the app at https://myaccount.google.com/permissions and retry."
      );
    }
  } catch (err) {
    console.error("Token exchange failed:", err);
  } finally {
    server.close();
    process.exit(0);
  }
});

server.listen(PORT, () => {
  console.log("Opening browser for Google consent…");
  console.log("If it doesn't open, visit:\n" + authUrl + "\n");
  const opener =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  exec(`${opener} "${authUrl}"`);
});
