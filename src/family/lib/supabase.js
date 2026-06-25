import { createClient } from "@supabase/supabase-js";

// Credentials come from .env.local (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
// When they are missing the app falls back to localStorage so the prototype
// still runs offline and the original game-time board is unaffected.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabase = Boolean(url && anonKey);

export const supabase = hasSupabase
  ? createClient(url, anonKey, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 10 } }
    })
  : null;

export const FAMILY_PHOTO_BUCKET = "family-photos";
const PHOTO_STORAGE_PREFIX = "storage:";

export async function uploadPhotoDataUrl(photoId, dataUrl) {
  if (!hasSupabase || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) return null;

  try {
    const blob = await fetch(dataUrl).then((r) => r.blob());
    const ext =
      blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
    const path = `${photoId}.${ext}`;
    const { error } = await supabase.storage.from(FAMILY_PHOTO_BUCKET).upload(path, blob, {
      upsert: true,
      contentType: blob.type || "image/jpeg",
      cacheControl: "31536000"
    });
    if (error) return null;
    return `${PHOTO_STORAGE_PREFIX}${path}`;
  } catch {
    return null;
  }
}

export function isStoragePhotoSrc(src) {
  return typeof src === "string" && src.startsWith(PHOTO_STORAGE_PREFIX);
}

export function photoStoragePathFromSrc(src) {
  if (isStoragePhotoSrc(src)) return src.slice(PHOTO_STORAGE_PREFIX.length);
  if (typeof src !== "string") return null;

  try {
    const pathname = new URL(src).pathname;
    for (const marker of [
      `/storage/v1/object/sign/${FAMILY_PHOTO_BUCKET}/`,
      `/storage/v1/object/public/${FAMILY_PHOTO_BUCKET}/`
    ]) {
      const i = pathname.indexOf(marker);
      if (i !== -1) return decodeURIComponent(pathname.slice(i + marker.length));
    }
  } catch {
    return null;
  }

  return null;
}

export async function resolvePhotoSrc(src, expiresIn = 60 * 60 * 24 * 30) {
  const path = photoStoragePathFromSrc(src);
  if (!hasSupabase || !path) return src;

  const { data, error } = await supabase.storage
    .from(FAMILY_PHOTO_BUCKET)
    .createSignedUrl(path, expiresIn);
  return error ? src : data?.signedUrl || src;
}

export async function deletePhotoObject(src) {
  const path = photoStoragePathFromSrc(src);
  if (!hasSupabase || !path) return true;

  const { error } = await supabase.storage.from(FAMILY_PHOTO_BUCKET).remove([path]);
  return !error;
}
