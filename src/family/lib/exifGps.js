// Minimal, dependency-free EXIF GPS reader for uploaded JPEGs, plus a
// reverse-geocoder. We read GPS from the ORIGINAL file because the canvas
// downscale in PhotosPage re-encodes the image and drops EXIF.

// Returns { lat, lon } in decimal degrees, or null if the file has no GPS.
export async function readGps(file) {
  try {
    const view = new DataView(await file.arrayBuffer());
    if (view.getUint16(0) !== 0xffd8) return null; // not a JPEG
    const len = view.byteLength;
    let offset = 2;
    while (offset + 4 < len) {
      const marker = view.getUint16(offset);
      if ((marker & 0xff00) !== 0xff00) break; // not a marker — bail
      const size = view.getUint16(offset + 2);
      if (marker === 0xffe1) {
        // APP1 — check for "Exif\0\0"
        if (view.getUint32(offset + 4) === 0x45786966) {
          return parseTiffForGps(view, offset + 10); // 4 (Exif) + 2 (\0\0)
        }
      }
      offset += 2 + size;
    }
    return null;
  } catch {
    return null;
  }
}

function parseTiffForGps(view, tiff) {
  const le = view.getUint16(tiff) === 0x4949; // 'II' = little-endian
  const u16 = (o) => view.getUint16(o, le);
  const u32 = (o) => view.getUint32(o, le);

  // IFD0 → find the GPS IFD pointer (tag 0x8825).
  const ifd0 = tiff + u32(tiff + 4);
  const n0 = u16(ifd0);
  let gpsPtr = 0;
  for (let i = 0; i < n0; i++) {
    const e = ifd0 + 2 + i * 12;
    if (u16(e) === 0x8825) {
      gpsPtr = u32(e + 8);
      break;
    }
  }
  if (!gpsPtr) return null;

  // GPS IFD entries, indexed by tag.
  const gps = tiff + gpsPtr;
  const ng = u16(gps);
  const tag = {};
  for (let i = 0; i < ng; i++) {
    const e = gps + 2 + i * 12;
    tag[u16(e)] = e;
  }
  if (!tag[2] || !tag[4]) return null;

  const rationals = (entry, count) => {
    const at = tiff + u32(entry + 8); // 3 rationals (24B) live at an offset
    const out = [];
    for (let i = 0; i < count; i++) {
      const num = u32(at + i * 8);
      const den = u32(at + i * 8 + 4);
      out.push(den ? num / den : 0);
    }
    return out;
  };
  const ref = (entry) => String.fromCharCode(view.getUint8(entry + 8)); // inline ASCII

  const [latD, latM, latS] = rationals(tag[2], 3);
  const [lonD, lonM, lonS] = rationals(tag[4], 3);
  let lat = latD + latM / 60 + latS / 3600;
  let lon = lonD + lonM / 60 + lonS / 3600;
  if (tag[1] && ref(tag[1]) === "S") lat = -lat;
  if (tag[3] && ref(tag[3]) === "W") lon = -lon;
  if (!isFinite(lat) || !isFinite(lon) || (lat === 0 && lon === 0)) return null;
  return { lat, lon };
}

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
