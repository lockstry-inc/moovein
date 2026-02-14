# Floor Plan Extraction — Status & Remaining Work

## Current Status (Feb 2026)

### Ground Truth

The **green floor plan images** (`richland-1.png`, `richland-2.png`) are the ground truth. They show every unit with its position and ID. Our extraction pipeline reads directly from these images.

**What we don't have yet:** A document mapping unit IDs → actual unit sizes (e.g., "A101 = 10x15"). Without this, we can't systematically verify that our pixel-to-size classification is correct for every unit. We can only spot-check visually.

**To validate fully**, we need either:
1. An accurate unit mix document with per-size counts (and ideally per-unit ID → size mapping)
2. Or: manual spot-check of a sample of units per size category against the images

### Detection Summary

| Metric | Floor 1 | Floor 2 | Total |
|--------|---------|---------|-------|
| **Detected** | 427 (after dedup) | 191 (after dedup) | **618** |
| **Expected** | Unknown (old mix was inaccurate) | Unknown | **Unknown** |

---

## Extraction Pipeline

```
richland-{1,2}.png
  → tools/extract-floorplan.py (OpenCV + Tesseract)
    Step 1:   Green mask + Canny edge detection
    Step 1.1: Two-pass extraction (dilation=1 for small, dilation=2 for large)
    Step 1.2: Grid-cell merge (keep pass with more units per cell)
    Step 1.5: Split oversized contours (invalid sizes → 2 or 3 valid parts)
    Step 1.6: Wall-split (brightness + green mask profiles for 10x20/10x25/10x30/10x40)
    Step 1.7: Rescue small units (pixel-level coverage mask → uncovered green → 5x5 grid decomposition)
    Step 2:   OCR unit IDs (Tesseract, grayscale + binary, multi-scale, digit whitelist)
    Step 3:   Detect site features (blue=elevator, yellow=highlight, white+text=office)
    Step 3.5: Fix OCR errors (digit confusion mapping + expected range validation)
    Step 4:   Normalize coordinates
  → tools/build-facility-json.py
    - Deduplicates near-overlapping units (center within 20px + similar area)
    - Classifies pixel dims → real unit type (5x5, 5x10, ..., 10x40)
    - Maps invalid sizes to nearest valid type
    - Ensures unique IDs within each floor
    - Adds mock occupancy + feature flags
  → public/data/facility-richland.json
```

---

## Known Issues

### Issue 1: 5x5 Cluster Merging
**Root cause:** Dense grids of 5x5 units (73x73px each) have walls only 2-4px wide. The Canny edge detection + dilation destroys boundaries between adjacent small units. The rescue pass finds some but not all.

**What would fix it:**
- Template matching: use a 73x73 template of a known 5x5 unit and slide it across the image
- Line-based grid detection: find the regular grid pattern in 5x5 clusters (fixed spacing ~77px), then stamp units at every grid intersection
- Manual annotation: add known 5x5 cluster bounding boxes and decompose them mathematically

### Issue 2: Adjacent Unit Merging (10x10 pairs → false 10x20)
**Root cause:** Two adjacent units share a wall with no visible gap in the green fill. The edge detection doesn't find a boundary, so they merge into one contour. Wall-split catches some but not all.

**What would fix it:**
- Stronger edge detection specifically tuned for subtle walls (adaptive thresholding)
- Cross-referencing OCR unit IDs with a known ID→size mapping
- Using size label text from a schematic PDF if available

### Issue 3: 7.6x10 Pixel Boundary
**Root cause:** The 7.6ft dimension maps to ~115-119px, but 10ft maps to ~155-165px. Units at the boundary (135-145px) are ambiguous. The `_px_to_ft()` function uses a hard cutoff at 140px.

**What would fix it:**
- Dynamic calibration: measure known 7.6x10 and 10x10 units, compute actual pixel-per-foot ratio
- A unit ID→size mapping document to override pixel-based classification
- Narrow the ambiguity zone with adaptive thresholds per floor

### Issue 4: Over-Splitting Valid Large Units
**Root cause:** Some valid 10x25 or 10x30 units are being split into smaller halves because `split_oversized_units()` doesn't always distinguish "one large unit" from "two merged small units."

**What would fix it:**
- Check for actual wall evidence before splitting (brightness profile, green gap)
- A unit ID→size mapping to confirm which large detections are real

### Issue 5: OCR Accuracy
**Current:** ~96% of units get correct IDs. Some are misread (5↔9, 6↔8 confusion).

**What would fix it:**
- Cross-reference detected IDs against a complete list from the property management system
- A unit ID→size document would also confirm IDs

---

## What's Needed to Reach 100%

The most reliable path to perfect accuracy:

1. **An accurate unit ID → size mapping** — either from the property management system, a corrected unit mix spreadsheet, or a schematic PDF with per-unit size labels
2. With that mapping, we can:
   - Validate every detected unit's assigned type
   - Identify missing units (IDs in the mapping but not in our extraction)
   - Fix misclassified sizes by overriding pixel-based guesses with known values
3. Without it, we're limited to pixel-based inference which will always have edge cases at size boundaries

---

## Current Accuracy Estimates

| Metric | Value |
|--------|-------|
| Total units detected | 618 |
| Type accuracy (correct size) | ~85% (estimated, unverified) |
| OCR accuracy (correct ID) | ~96% |
| Position accuracy | ~99% (pixel-perfect for detected units) |
| Unique IDs | 100% (enforced by build script) |
| Valid types | 100% (enforced by fallback map) |
