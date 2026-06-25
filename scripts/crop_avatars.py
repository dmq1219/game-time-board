#!/usr/bin/env python3
"""Crop the 6-up avatar sheet into circular per-member PNGs.

Detects each circle's frame on the white background (first non-white pixel
scanning inward along the cell's centre lines), then masks to a clean circle
with a transparent outside. Output: public/avatars/<id>.png
"""
import os
from PIL import Image, ImageDraw, ImageChops

SRC = os.path.expanduser("~/Downloads/ChatGPT Image Jun 24, 2026, 02_23_11 PM.png")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "avatars")
OUT_SIZE = 220  # final square px per avatar

# member id -> (col, row) in the 3x2 grid
CELLS = {
    "mom":  (0, 0),  # glasses woman
    "dad":  (1, 0),  # bearded man
    "emma": (2, 0),  # boy with spinning top  (CT)
    "liam": (0, 1),  # boy with spatula       (Edward)
    "noah": (1, 1),  # purple-shirt girl      (Sarah)
    "zoe":  (2, 1),  # girl with bunny toy    (Katty)
}

WHITE = 247  # a pixel is "background" if every channel >= WHITE


def detect_circle(img, col, row, cw, ch):
    """Return (cx, cy, r) from the non-white bounding box inside the cell.

    The outermost non-white pixels in a cell are the circle's frame ring, so
    the bbox of all non-background pixels gives the circle extent directly —
    robust even when the ring is faint (centre-line scanning is not)."""
    x0, y0 = col * cw, row * ch
    cell = img.crop((x0, y0, x0 + cw, y0 + ch))
    white = Image.new("RGB", cell.size, (255, 255, 255))
    diff = ImageChops.difference(cell, white).convert("L")
    mask = diff.point(lambda p: 255 if p >= (255 - WHITE) else 0)
    xmin, ymin, xmax, ymax = mask.getbbox()
    cx = x0 + (xmin + xmax) / 2
    cy = y0 + (ymin + ymax) / 2
    r = ((xmax - xmin) + (ymax - ymin)) / 4
    return cx, cy, r


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    img = Image.open(SRC).convert("RGB")
    W, H = img.size
    cw, ch = W // 3, H // 2

    # The sheet is a clean 3x2 grid of uniform circles. Content bbox under-
    # estimates the radius for light-edged avatars (chef hat, pale shirts), so
    # use fixed cell-centre geometry with one uniform radius instead.
    RADIUS = 246

    for mid, (col, row) in CELLS.items():
        cx = col * cw + cw / 2
        cy = row * ch + ch / 2
        r = RADIUS
        box = (round(cx - r), round(cy - r), round(cx + r), round(cy + r))
        crop = img.crop(box).resize((OUT_SIZE, OUT_SIZE), Image.LANCZOS)

        # circular alpha mask (supersampled for smooth edge)
        ss = OUT_SIZE * 4
        mask = Image.new("L", (ss, ss), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, ss - 1, ss - 1), fill=255)
        mask = mask.resize((OUT_SIZE, OUT_SIZE), Image.LANCZOS)

        out = Image.new("RGBA", (OUT_SIZE, OUT_SIZE), (0, 0, 0, 0))
        out.paste(crop, (0, 0), mask)
        path = os.path.join(OUT_DIR, f"{mid}.png")
        out.save(path)
        print(f"{mid:5s} cell=({col},{row}) center=({cx:.0f},{cy:.0f}) r={r:.0f} -> {path}")


if __name__ == "__main__":
    main()
