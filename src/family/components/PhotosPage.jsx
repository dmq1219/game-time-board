import React, { useRef, useState } from "react";
import { readGps, reverseGeocode } from "../lib/exifGps";

// Downscale an uploaded image to keep localStorage small (it has a ~5 MB cap).
function fileToDataUrl(file, maxDim = 1280) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function PhotosPage({ photos, onAdd, onDelete, onToggleFavorite, onStartScreensaver }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleFiles = async (files) => {
    setError("");
    setInfo("");
    setBusy(true);
    let added = 0;
    let located = 0;
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        // Read GPS from the ORIGINAL file (downscaling drops EXIF), then
        // reverse-geocode to a place label. Both are best-effort.
        // eslint-disable-next-line no-await-in-loop
        const gps = await readGps(file);
        // eslint-disable-next-line no-await-in-loop
        const place = gps ? await reverseGeocode(gps.lat, gps.lon) : null;
        // eslint-disable-next-line no-await-in-loop
        const src = await fileToDataUrl(file);
        onAdd(src, file.name.replace(/\.[^.]+$/, ""), place);
        added += 1;
        if (place) located += 1;
      }
      if (added) {
        setInfo(
          located
            ? `已添加 ${added} 张,其中 ${located} 张读到了拍摄地点 📍`
            : `已添加 ${added} 张。没读到拍摄地点 —— 这些照片可能没有 GPS 信息(截图/网图/已抹除定位的都没有);iPhone 照片请用 JPG 而非 HEIC。`
        );
      }
    } catch {
      setError("这张图读不了。HEIC 格式在多数浏览器无法处理,请改用 JPG 或 PNG。");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="fh-page fh-photos-page">
      <div className="fh-photos-head">
        <div>
          <h2 className="fh-page-title">Photos · 照片屏保</h2>
          <p className="fh-muted">
            Idle for 3 minutes shows these as a slideshow. Favorites (★) appear first.
          </p>
        </div>
        <div className="fh-photos-actions">
          <button type="button" className="fh-btn-primary" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? "Adding…" : "+ Upload photos"}
          </button>
          <button type="button" className="fh-btn-ghost" onClick={onStartScreensaver}>
            ▶ Preview screensaver
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      {error && <p className="fh-error">{error}</p>}
      {info && <p className="fh-info">{info}</p>}

      <div className="fh-photo-grid">
        {photos.length === 0 && <p className="fh-muted">No photos yet — upload some to start the frame.</p>}
        {photos.map((p) => (
          <figure key={p.id} className="fh-photo">
            <img src={p.src} alt={p.name} loading="lazy" />
            <figcaption>
              {p.name}
              {p.place && (
                <span className="fh-photo-place">📍 {p.place.en || p.place.zh}</span>
              )}
            </figcaption>
            <div className="fh-photo-tools">
              <button
                type="button"
                className={`fh-fav${p.favorite ? " on" : ""}`}
                onClick={() => onToggleFavorite(p.id)}
                aria-label="Favorite"
                title="Favorite"
              >
                {p.favorite ? "★" : "☆"}
              </button>
              <button
                type="button"
                className="fh-photo-del"
                onClick={() => onDelete(p.id)}
                aria-label="Delete"
                title="Delete"
              >
                🗑
              </button>
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}
