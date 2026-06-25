import React, { useState } from "react";

// Lightweight access gate for the public Pages URL.
// Enabled only when VITE_FAMILY_PIN is set at build time; otherwise renders
// children directly (keeps dev / offline / un-deployed use frictionless).
// Note: this is an app-layer lock for casual access (kids, passers-by), NOT a
// server-side guarantee — the Supabase anon key still ships in the bundle, so
// enable Supabase RLS too if the data is sensitive.

const EXPECTED = import.meta.env.VITE_FAMILY_PIN;
const STORAGE_KEY = "familyHub.unlocked";

export default function PinGate({ children }) {
  // No PIN configured -> no gate.
  const [unlocked, setUnlocked] = useState(() => {
    if (!EXPECTED) return true;
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [entry, setEntry] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return children;

  const submit = (e) => {
    e.preventDefault();
    if (entry === String(EXPECTED)) {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* private mode — stay unlocked for this session only */
      }
      setUnlocked(true);
    } else {
      setError(true);
      setEntry("");
    }
  };

  return (
    <div className="fh-pin-root">
      <form className="fh-pin-card" onSubmit={submit}>
        <div className="fh-pin-title">🔒 Family Hub</div>
        <div className="fh-pin-sub">输入访问 PIN</div>
        <input
          className={`fh-pin-input${error ? " fh-pin-input-err" : ""}`}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          value={entry}
          onChange={(e) => {
            setEntry(e.target.value);
            setError(false);
          }}
          aria-label="Access PIN"
        />
        {error && <div className="fh-pin-err">PIN 不正确,请重试</div>}
        <button className="fh-pin-btn" type="submit">
          进入
        </button>
      </form>
    </div>
  );
}
