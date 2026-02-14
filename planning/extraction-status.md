# Floor Plan Extraction — Status & Remaining Work

## Current Status (Feb 2026)

### Detection Accuracy

| Metric | Floor 1 | Floor 2 | Total |
|--------|---------|---------|-------|
| **Detected** | 427 (after dedup) | 191 (after dedup) | **618** |
| **Expected** | 484 (F1+B2+B3) | 185 | **669** |
| **Coverage** | 88.2% | 103.2% | **92.4%** |

Floor 2 over-detects slightly because the rescue pass adds some false positives for 5x5 units.

### Per-Size Breakdown (Floor 1)

| Size | Detected | Expected | Delta | Notes |
|------|----------|----------|-------|-------|
| 5x5 | 28 | 80 | **-52** | Dense clusters merge; rescue only recovers ~36, dedup removes some |
| 5x10 | 106 | 120 | -14 | Some merged with neighbors |
| 5x15 | 19 | 13 | +6 | Some 5x10+partial merges classified as 5x15 |
| 7.6x10 | 22 | 14 | +8 | Boundary pixel measurements (140-160px ambiguity) |
| 10x10 | 97 | 104 | -7 | Close — some hiding in merged 10x20 |
| 10x15 | 62 | 81 | **-19** | Many merged into 10x20 or 10x25 detections |
| 10x20 | 58 | 41 | **+17** | Excess = merged 10x10 pairs that weren't split |
| 10x25 | 18 | 6 | **+12** | Excess = merged 10x10+10x15 pairs |
| 10x30 | 17 | 25 | -8 | Some being over-split into 10x15 pairs |
| 10x40 | 0 | 1 | -1 | Likely classified as 10x30 or similar |

### Per-Size Breakdown (Floor 2)

| Size | Detected | Expected | Delta | Notes |
|------|----------|----------|-------|-------|
| 5x5 | 19 | 25 | -6 | Same cluster merge issue |
| 5x10 | 48 | 49 | -1 | Almost perfect |
| 5x15 | 1 | 1 | 0 | Exact |
| 7.6x10 | 35 | 50 | -15 | Under-detecting; some classified as 10x10 |
| 10x10 | 54 | 40 | +14 | Over — absorbing some 7.6x10 and splitting 10x25 |
| 10x15 | 25 | 18 | +7 | Over — some from split 10x25 |
| 10x20 | 9 | 8 | +1 | Close |
| 10x25 | 0 | 8 | **-8** | ALL being split into 10x10+10x15 pairs |

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

## Known Issues (To Get to 100%)

### Issue 1: 5x5 Cluster Merging (Impact: ~58 missing units)
**Root cause:** Dense grids of 5x5 units (73x73px each) have walls only 2-4px wide. The Canny edge detection + dilation destroys boundaries between adjacent small units. The rescue pass finds some but not all.

**What would fix it:**
- Template matching: use a 73x73 template of a known 5x5 unit and slide it across the image
- Line-based grid detection: find the regular grid pattern in 5x5 clusters (fixed spacing ~77px), then stamp units at every grid intersection
- Manual annotation: add known 5x5 cluster bounding boxes and decompose them mathematically

### Issue 2: 10x20/10x25 Merge Pairs (Impact: ~29 excess large, ~19 missing medium)
**Root cause:** Two adjacent units (e.g., two 10x10s) share a wall with no visible gap in the green fill. The edge detection doesn't find a boundary, so they merge into one contour. Wall-split catches ~19 of ~49 merges (39%).

**What would fix it:**
- Stronger edge detection specifically tuned for subtle walls (adaptive thresholding)
- Training a model on known 10x10 vs 10x20 units based on position and neighbors
- Using the PDF's unit-level labels: OCR the size label text (e.g., "10 x 10") from the schematic PDF (not the green map PNG) and use that as ground truth per unit position
- Cross-referencing OCR unit IDs with the schematic to determine which units are 10x20 vs paired 10x10s

### Issue 3: 7.6x10 Pixel Boundary (Impact: ~8 misclassified on F1, ~15 on F2)
**Root cause:** The 7.6ft (7'6") dimension maps to ~115-119px, but 10ft maps to ~155-165px. Units at the boundary (135-145px) are ambiguous between 7.6 and 10 feet. The `_px_to_ft()` function uses a hard cutoff at 140px.

**What would fix it:**
- Dynamic calibration: measure a few known 7.6x10 and 10x10 units, compute the actual pixel-per-foot ratio for this specific image
- Use the PDF schematic labels as ground truth (they explicitly say "7-6 x 10" vs "10 x 10")
- Narrow the ambiguity zone with adaptive thresholds per floor

### Issue 4: 10x25 Over-Split on Floor 2 (Impact: 8 units)
**Root cause:** ALL 10x25 units on floor 2 are being split by `split_oversized_units()` into 10x10 + 10x15 because the function doesn't know 10x25 is a valid size that should sometimes be preserved. The split produces valid halves so it always triggers.

**What would fix it:**
- Change `split_oversized_units()` to check if the original is already a valid size AND only split when there's actual evidence of a wall (currently it splits purely based on dimension math)
- Or: skip splitting for units whose pixel dimensions fall cleanly within the 10x25 range (390-440px)

### Issue 5: OCR Accuracy
**Current:** ~96% of units get correct IDs. Some are misread (5↔9, 6↔8 confusion). The expected-range correction fixes many but not all.

**What would fix it:**
- Cross-reference detected IDs against a complete list from the property management system
- Use the schematic PDF unit labels (which have both ID and size) as the single source of truth

---

## The Nuclear Option (100% Accuracy Path)

The schematic PDF (`planning/richland-unit-mix.pdf`) contains **every unit** with its exact size label and position. Instead of trying to extract from the green-fill PNG (which was designed for visualization, not data extraction), we could:

1. Parse the PDF's vector/text layer to extract unit positions + size labels directly
2. Map PDF coordinates to PNG pixel coordinates (they share the same layout)
3. Use the PDF data as the authoritative source for unit types and counts
4. Use the PNG data only for the pixel coordinates needed by the interactive map

This would give us 100% accuracy on both counts and types, since the PDF IS the ground truth.

---

## Current Accuracy Summary

| Metric | Value |
|--------|-------|
| Total units detected | 618 / 669 = **92.4%** |
| Type accuracy (correct size) | ~85% (estimated) |
| OCR accuracy (correct ID) | ~96% |
| Position accuracy | ~99% (pixel-perfect for detected units) |
| Unique IDs | 100% (enforced by build script) |
| Valid types | 100% (enforced by fallback map) |
