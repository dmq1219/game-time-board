// Reverse-geocoder for photo GPS coordinates. (GPS extraction itself is done
// by the `exifr` library in PhotosPage, which reads JPEG and HEIC.)

// BigDataCloud reverse-geocode (no key, CORS-friendly) in one language.
async function geocodeOne(lat, lon, lang) {
  const url =
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}` +
    `&longitude=${lon}&localityLanguage=${lang}`;
  const res = await fetch(url);
  if (!res.ok) return "";
  const d = await res.json();
  const place = d.locality || d.city || d.principalSubdivision || "";
  const country = (d.countryName || "").replace(/\s*\(the\)$/i, "");
  const sep = lang === "zh" ? " · " : ", ";
  return [place, country].filter(Boolean).join(sep);
}

// Returns { en, zh } place labels, or null on failure / no result.
export async function reverseGeocode(lat, lon) {
  try {
    const [en, zh] = await Promise.all([geocodeOne(lat, lon, "en"), geocodeOne(lat, lon, "zh")]);
    if (!en && !zh) return null;
    return { en: en || zh, zh: zh || en };
  } catch {
    return null;
  }
}
