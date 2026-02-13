# Floor Plan Extraction Tool — Status

## Overview

`tools/extract-floorplan.py` takes a facility site map PNG and extracts pixel-perfect unit coordinates + IDs into structured JSON for the interactive web map.

**Pipeline:** Site Map PNG → OpenCV contour detection → Tesseract OCR → JSON

---

## How It Works

### Contour Detection (unit positions)
1. Color-threshold the image in HSV to isolate green unit rectangles (H=45-58, S=100+, V=40+)
2. Detect edges (Canny) and dilate them to create reliable separators between adjacent units sharing walls (~4px gaps at 4800px resolution)
3. Subtract edge lines from the green mask to break merged regions into individual units
4. Find contours → extract bounding boxes (x, y, w, h) in pixel coordinates

### OCR (unit IDs)
1. **Primary strategy:** Feed grayscale crop directly to Tesseract (OEM 1 / LSTM mode, PSM 7). Letting Tesseract handle its own binarization preserves subtle stroke differences (critical for 5 vs 9 in this bold font).
2. **Fallback strategy:** Otsu binary threshold → Tesseract (OEM 3, PSM 7)
3. **Multi-scale:** Tries 4x and 6x upscaling with Lanczos interpolation
4. **Best-pick heuristic:** Prefers 3-digit IDs, then most frequent result across strategies

### Post-Processing
- `--expected-range` flag enables automatic OCR error correction
- Tries common digit confusion substitutions: 5↔9, 6↔8, 3↔8, 1↔7
- Supports multi-digit simultaneous substitutions (e.g., "995" → "555")
- Handles dropped leading digits (e.g., "77" → "477")

### Site Feature Detection
- Blue regions → elevator
- Yellow/orange regions → highlighted/special areas
- White regions with "OFFICE" text → office
- Staircase icons detected by color

---

## Current Results

### Ground Floor (`richland-1.png`)

| Metric | Value |
|--------|-------|
| Image dimensions | 4800 x 5200 |
| Contours detected | **390** |
| Unique IDs | **389** |
| IDs in expected range (1-614) | **100%** |
| OCR corrections needed | 0 |
| Duplicates | `228` appears twice |

**Known Issues:**
- **Duplicate 228:** Edge detection likely split one unit into two adjacent contours. Need to inspect the debug overlay at unit 228's location to determine if it's a split or a genuine second detection.
- **8 extra units vs original HTML (390 vs 382):** The original `storage.html` has 382 manually plotted units. The extraction found 390. Differences could be: the 600-series units (600-614 = 15 units in the upper section), slightly different boundaries, or false positive small artifacts. Cross-referencing against the original data would clarify.
- **"Missing" IDs in 1-614 range:** Not all numbers in 1-614 correspond to physical units — there are intentional gaps in the numbering. This is expected, not an error.

### 2nd Floor (`richland-2.png`)

| Metric | Value |
|--------|-------|
| Image dimensions | 4800 x 5200 |
| Contours detected | **189** |
| Unique IDs | **188** |
| IDs in expected range (400-589) | **100%** (after corrections) |
| OCR corrections applied | **50** |
| Duplicates | `477` appears twice |
| Missing IDs | `418`, `577` |

**Known Issues:**
- **Systematic 5→9 OCR error:** Tesseract consistently misreads the bold "5" as "9" in this font. The `--expected-range 400-589` flag corrects 50 of these automatically.
- **Duplicate 477:** The OCR correction converted "77" → "477", but a real 477 already exists. One of these two contours is likely unit 418 or 577 (the two missing IDs).
- **Missing 418, 577:** These 2 unit IDs were not found. Likely their OCR results collided with other IDs after correction.
- **Site features detected:** 1 elevator (blue icon), 2 highlights (yellow/orange staircase areas)

---

## CLI Usage

```bash
# Ground Floor
python tools/extract-floorplan.py richland-1.png \
  --output public/data/richland-floor1.json \
  --debug \
  --floor-name "Ground Floor" \
  --floor-id "floor-1" \
  --expected-range "1-614"

# 2nd Floor
python tools/extract-floorplan.py richland-2.png \
  --output public/data/richland-floor2.json \
  --debug \
  --floor-name "2nd Floor" \
  --floor-id "floor-2" \
  --expected-range "400-589"
```

### Flags
| Flag | Description |
|------|-------------|
| `--output`, `-o` | Output JSON file path (required) |
| `--debug` | Generate debug overlay PNG showing detected rectangles + IDs |
| `--target-width` | Scale coordinates to a target width (e.g., 1200 for the web map) |
| `--floor-name` | Human-readable floor name in output JSON |
| `--floor-id` | Machine floor ID in output JSON |
| `--expected-range` | Expected unit ID range (e.g., "400-589") for OCR error correction |

---

## Validation

### Debug Overlay Images
The `--debug` flag generates:
- `<input>.debug.png` — full-resolution overlay (red rectangles + IDs drawn on original)
- `<input>.debug-small.png` — scaled-down version for quick viewing

### Interactive Validation Tool
Open `tools/validate.html` in a browser to interactively compare extracted data against the original PNG:
- Renders extracted unit rectangles on top of the original image
- Toggle overlay visibility to check alignment
- Hover units to see ID + coordinates
- Highlights duplicates and missing IDs

---

## Dependencies

```
pip install opencv-python-headless pytesseract numpy Pillow
apt install tesseract-ocr
```

---

## Next Steps to Improve

1. **Fix duplicate 228 (floor 1) and 477 (floor 2):** Inspect debug overlays at those locations. May need to merge nearby contours that represent the same unit, or adjust edge detection sensitivity.
2. **Recover missing 418, 577 (floor 2):** Check if these units' contours were detected but their OCR collided. Could disambiguate by checking spatial position against neighboring units.
3. **Office detection (floor 1):** The office label area is not being detected as a site feature — the white region + "OFFICE" text OCR needs tuning.
4. **Staircase detection (floor 2):** The zigzag staircase icons are currently detected as "highlight" type. Could refine to specifically label as "stairs".
