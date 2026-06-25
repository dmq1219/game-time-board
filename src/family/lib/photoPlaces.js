// Per-photo location label store. Kept in localStorage (keyed by photo id)
// rather than Supabase so we don't need a schema change; the screensaver runs
// on the same kiosk where photos are uploaded, so this is sufficient.

const KEY = "familyHub.photoPlaces";

export function loadPlaces() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function savePlace(id, place) {
  if (!id || !place) return;
  try {
    const all = loadPlaces();
    all[id] = place; // { en, zh }
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* private mode / quota — non-fatal */
  }
}
