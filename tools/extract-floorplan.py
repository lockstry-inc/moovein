#!/usr/bin/env python3
"""
Floor Plan Extraction Tool
===========================
Takes a site map PNG and extracts pixel-perfect unit coordinates + IDs.
Outputs structured JSON for the Moove In interactive map.

Usage:
  python extract-floorplan.py <input.png> --output <output.json> [--debug]

The --debug flag generates an overlay image showing detected units,
allowing visual comparison against the original.
"""

import argparse
import json
import sys
from pathlib import Path

import cv2
import numpy as np
import pytesseract


# ---------------------------------------------------------------------------
# Color thresholds (HSV) — calibrated from richland-1.png / richland-2.png
# Green units: H=50-52, S=150-156, V=50-217 (tight range)
# We widen slightly to catch anti-aliased edges
# ---------------------------------------------------------------------------
GREEN_LOWER = np.array([45, 100, 40])
GREEN_UPPER = np.array([58, 255, 230])

BLUE_LOWER = np.array([80, 50, 50])
BLUE_UPPER = np.array([130, 255, 255])

YELLOW_LOWER = np.array([15, 80, 80])
YELLOW_UPPER = np.array([35, 255, 255])


def extract_units(img, hsv, scale_factor):
    """Detect green unit rectangles and extract bounding boxes.

    Uses a two-pass approach:
      Pass 1 (gentle): edge dilation=1 — catches small 5x5 units that were
        previously lost when dilation=2 eroded them below threshold.
      Pass 2 (strong): edge dilation=2 — better at separating medium/large
        adjacent units where the dark boundary is subtle.

    Results are merged: for any region covered by both passes, the pass that
    produces more (smaller) units wins — since over-splitting is preferable
    to under-splitting (can be merged back, but can't split what you missed).
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Step 1: Get green mask
    mask = cv2.inRange(hsv, GREEN_LOWER, GREEN_UPPER)

    # Step 2: Detect edges (shared between passes)
    edges = cv2.Canny(gray, 50, 150)
    edge_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))

    all_units = []

    for dilation_iters in [1, 2]:
        # Dilate edges — more iterations = thicker separator lines
        edges_thick = cv2.dilate(edges, edge_kernel, iterations=dilation_iters)

        # Subtract edge lines from green mask to separate adjacent units
        mask_separated = cv2.bitwise_and(mask, cv2.bitwise_not(edges_thick))

        # Clean up noise (morph open removes tiny fragments)
        clean_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        mask_separated = cv2.morphologyEx(mask_separated, cv2.MORPH_OPEN, clean_kernel, iterations=1)

        # Find contours
        contours, _ = cv2.findContours(mask_separated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        units = []
        # Lower min_area to catch 5x5 units (73x73=5329px², but after edge
        # subtraction they can shrink to ~55x55=3025px² or even smaller)
        min_area = 1500
        max_area = 600000

        for contour in contours:
            area = cv2.contourArea(contour)
            if area < min_area or area > max_area:
                continue

            x, y, w, h = cv2.boundingRect(contour)

            # Skip very elongated shapes (artifacts, not units)
            aspect = max(w, h) / max(min(w, h), 1)
            if aspect > 8:
                continue

            # Skip very small regions (noise)
            if w < 15 or h < 15:
                continue

            units.append({
                "x": x,
                "y": y,
                "w": w,
                "h": h,
                "area": area,
                "contour": contour,
                "pass": dilation_iters,
            })

        all_units.append(units)

    # Merge passes: use a grid-based approach
    # For each area of the image, keep whichever pass produced more units
    pass1_units, pass2_units = all_units

    final_units = _merge_passes(pass1_units, pass2_units)

    # Return the last mask for debug (pass 1 — the gentler one)
    edges_gentle = cv2.dilate(edges, edge_kernel, iterations=1)
    mask_final = cv2.bitwise_and(mask, cv2.bitwise_not(edges_gentle))
    mask_final = cv2.morphologyEx(mask_final, cv2.MORPH_OPEN,
                                   cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3)),
                                   iterations=1)
    return final_units, mask_final


def _merge_passes(pass1, pass2):
    """Merge results from two extraction passes.

    Strategy: divide the image into a grid of cells. For each cell,
    count how many units each pass detected. Keep the pass that found
    more units in that cell (more = better separation). For cells where
    both passes found the same count, prefer pass 2 (stronger separation
    is generally more reliable for medium/large units).
    """
    CELL_SIZE = 200  # pixels

    def cell_key(u):
        cx = u["x"] // CELL_SIZE
        cy = u["y"] // CELL_SIZE
        return (cx, cy)

    # Group units by grid cell
    from collections import defaultdict
    cells1 = defaultdict(list)
    cells2 = defaultdict(list)

    for u in pass1:
        cells1[cell_key(u)].append(u)
    for u in pass2:
        cells2[cell_key(u)].append(u)

    # All cells from both passes
    all_cells = set(cells1.keys()) | set(cells2.keys())

    final = []
    for cell in all_cells:
        c1 = cells1.get(cell, [])
        c2 = cells2.get(cell, [])

        if len(c1) > len(c2):
            # Pass 1 found more units here — better separation
            final.extend(c1)
        else:
            # Pass 2 found same or more — use it (stronger separation)
            final.extend(c2)

    return final


def rescue_small_units(img, hsv, existing_units):
    """Rescue pass for 5x5 units missed by the main extraction.

    The main extraction uses edge subtraction which destroys small units in
    tight grids. This pass uses a pixel-level coverage mask to find green
    regions NOT covered by any existing unit, then looks for 5x5-sized
    blocks in those uncovered areas.

    Strategy:
      1. Build a pixel mask of areas already covered by existing units
      2. Get the raw green mask (no edge subtraction)
      3. Subtract the coverage mask → only uncovered green remains
      4. Find contours in the uncovered green
      5. For each contour, check if it matches 5x5 dimensions or can be
         grid-decomposed into 5x5 cells
    """
    mask = cv2.inRange(hsv, GREEN_LOWER, GREEN_UPPER)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    img_h, img_w = img.shape[:2]

    # Expected 5x5 unit size in pixels (with tolerance)
    UNIT_5x5_MIN = 50    # minimum dimension for a 5x5 unit
    UNIT_5x5_MAX = 95    # maximum dimension for a 5x5 unit
    UNIT_5x5_NOMINAL = 73  # typical pixel size

    # Build pixel-level coverage mask from existing units
    # (with a small inset so we don't miss units sitting right at the edge)
    coverage = np.zeros((img_h, img_w), dtype=np.uint8)
    INSET = 5  # pixels to shrink each existing unit's coverage
    for u in existing_units:
        x1 = u["x"] + INSET
        y1 = u["y"] + INSET
        x2 = u["x"] + u["w"] - INSET
        y2 = u["y"] + u["h"] - INSET
        if x2 > x1 and y2 > y1:
            coverage[y1:y2, x1:x2] = 255

    # Subtract covered areas from green mask
    uncovered_green = cv2.bitwise_and(mask, cv2.bitwise_not(coverage))

    # Clean up tiny specks
    clean = cv2.morphologyEx(uncovered_green, cv2.MORPH_OPEN,
                              cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3)))

    # Find contours in uncovered green regions
    contours, _ = cv2.findContours(clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    rescued = []
    for contour in contours:
        area = cv2.contourArea(contour)
        x, y, w, h = cv2.boundingRect(contour)

        if area < 800:  # Too small to be even a partial unit
            continue

        # Single small unit that was missed
        if (UNIT_5x5_MIN <= w <= UNIT_5x5_MAX and
                UNIT_5x5_MIN <= h <= UNIT_5x5_MAX and
                area >= 1200):
            rescued.append({"x": x, "y": y, "w": w, "h": h,
                            "area": area, "contour": contour})
            continue

        # Cluster of merged small units — try grid decomposition
        if area >= 2000 and w <= 600 and h <= 600:
            grid_units = _grid_decompose_5x5(gray, uncovered_green, x, y, w, h,
                                              UNIT_5x5_NOMINAL)
            rescued.extend(grid_units)

    return rescued


def _grid_decompose_5x5(gray, green_mask, rx, ry, rw, rh, cell_size):
    """Decompose a rectangular region into a grid of 5x5-sized cells.

    Looks at the dark lines within the region to find the actual cell
    boundaries, then extracts individual cells.
    """
    units = []

    # Estimate number of cells along each axis
    # Add ~4px for walls between units
    cell_with_wall = cell_size + 4
    n_cols = max(1, round(rw / cell_with_wall))
    n_rows = max(1, round(rh / cell_with_wall))

    if n_cols <= 0 or n_rows <= 0:
        return units

    # Calculate cell dimensions
    cell_w = rw / n_cols
    cell_h = rh / n_rows

    # Only decompose if cells are roughly 5x5 unit sized
    if not (50 <= cell_w <= 100 and 50 <= cell_h <= 100):
        return units

    for row in range(n_rows):
        for col in range(n_cols):
            cx = int(rx + col * cell_w)
            cy = int(ry + row * cell_h)
            cw = int(cell_w)
            ch = int(cell_h)

            # Verify this cell has enough green pixels
            cell_mask = green_mask[cy:cy+ch, cx:cx+cw]
            if cell_mask.size == 0:
                continue
            green_ratio = cv2.countNonZero(cell_mask) / cell_mask.size
            if green_ratio > 0.3:  # At least 30% green
                units.append({
                    "x": cx, "y": cy, "w": cw, "h": ch,
                    "area": cw * ch, "contour": None,
                })

    return units


def split_by_internal_walls(units, gray_img, green_mask):
    """Split units that have a clear dark internal wall visible in the image.

    Only tries units whose size is a plausible merge result:
      - 10x20 → could be 2× 10x10
      - 10x25 → could be 10x10 + 10x15
      - 10x30 → could be 2× 10x15
      - 10x40 → could be 2× 10x20
      - Any invalid size (not in VALID_SIZES_FT)

    Does NOT try splitting already-valid non-merge sizes like 10x15, 10x10,
    5x10, etc. — those would produce invalid halves (e.g., splitting 10x15
    gives ~10x7.6 which is falsely valid but wrong).
    """
    # Sizes (in feet, sorted tuple) that are known merge candidates
    SPLITTABLE_SIZES = {(10, 20), (10, 25), (10, 30), (10, 40)}

    final = []
    split_count = 0

    for unit in units:
        w, h = unit["w"], unit["h"]
        x, y = unit["x"], unit["y"]

        w_ft = _px_to_ft(w)
        h_ft = _px_to_ft(h)
        dims_ft = tuple(sorted([w_ft, h_ft]))

        # Decide if this unit should be tried for wall-splitting
        should_try = False
        if dims_ft in SPLITTABLE_SIZES:
            should_try = True
        elif not _is_valid_size(w, h) and max(w, h) >= 200:
            # Invalid size that might be a merge artifact
            should_try = True

        if not should_try:
            final.append(unit)
            continue

        # Look for a dark vertical or horizontal line through the unit
        split_result = _find_internal_wall(gray_img, green_mask, x, y, w, h)
        if split_result:
            final.extend(split_result)
            split_count += 1
        else:
            final.append(unit)

    if split_count:
        print(f"  Wall-split {split_count} merged units")

    return final


def _find_internal_wall(gray, green_mask, x, y, w, h):
    """Look for a wall running through a unit and split there.

    Uses two strategies:
      1. Green mask gap: count green pixels per column/row — a wall shows
         as a dip in the green pixel count.
      2. Grayscale brightness: a wall shows as a dark line in brightness.
    """
    crop_gray = gray[y:y+h, x:x+w]
    crop_green = green_mask[y:y+h, x:x+w]
    if crop_gray.size == 0 or crop_green.size == 0:
        return None

    # Strategy 1: Green mask profile (more reliable)
    # Count green pixels per column and per row
    axes = []
    if w >= h:
        # Check vertical split first (columns)
        col_green = (crop_green > 0).sum(axis=0).astype(float)
        row_green = (crop_green > 0).sum(axis=1).astype(float)
        axes = [('vertical', col_green, h), ('horizontal', row_green, w)]
    else:
        row_green = (crop_green > 0).sum(axis=1).astype(float)
        col_green = (crop_green > 0).sum(axis=0).astype(float)
        axes = [('horizontal', row_green, w), ('vertical', col_green, h)]

    for axis, profile, cross_dim in axes:
        result = _find_split_by_green_gap(profile, cross_dim, x, y, w, h, axis)
        if result:
            return result

    # Strategy 2: Grayscale brightness (fallback)
    axes2 = []
    if w >= h:
        axes2 = [('vertical', crop_gray.mean(axis=0)), ('horizontal', crop_gray.mean(axis=1))]
    else:
        axes2 = [('horizontal', crop_gray.mean(axis=1)), ('vertical', crop_gray.mean(axis=0))]

    for axis, profile in axes2:
        result = _find_split_point(profile, x, y, w, h, axis=axis)
        if result:
            return result

    return None


def _find_split_by_green_gap(profile, cross_dim, x, y, w, h, axis):
    """Find a split point where the green pixel count dips significantly."""
    n = len(profile)
    # Search in the middle 70% of the unit
    start = int(n * 0.15)
    end = int(n * 0.85)
    if end <= start + 4:
        return None

    middle = profile[start:end]
    if middle.max() == 0:
        return None

    # Normalize by the cross dimension (what fraction of pixels are green)
    green_frac = middle / cross_dim

    # Find the minimum in the middle region
    min_idx = start + np.argmin(middle)
    min_frac = profile[min_idx] / cross_dim

    # The wall should have significantly fewer green pixels than the average
    avg_frac = green_frac.mean()
    if avg_frac < 0.3:  # Not enough green in this unit
        return None
    if min_frac > avg_frac * 0.7:  # Gap should be at least 30% less green
        return None

    # Verify by checking the split produces valid sizes
    if axis == 'vertical':
        left_w = min_idx
        right_w = w - min_idx
        if left_w < 30 or right_w < 30:
            return None
        if _is_valid_size(left_w, h) and _is_valid_size(right_w, h):
            return [
                {"x": x, "y": y, "w": left_w, "h": h,
                 "area": left_w * h, "contour": None},
                {"x": x + min_idx, "y": y, "w": right_w, "h": h,
                 "area": right_w * h, "contour": None},
            ]
    else:
        top_h = min_idx
        bottom_h = h - min_idx
        if top_h < 30 or bottom_h < 30:
            return None
        if _is_valid_size(w, top_h) and _is_valid_size(w, bottom_h):
            return [
                {"x": x, "y": y, "w": w, "h": top_h,
                 "area": w * top_h, "contour": None},
                {"x": x, "y": y + min_idx, "w": w, "h": bottom_h,
                 "area": w * bottom_h, "contour": None},
            ]

    return None


def _find_split_point(profile, x, y, w, h, axis):
    """Find the darkest point in the middle region of the brightness profile."""
    n = len(profile)
    # Only search in the middle 60% of the unit (walls should be near center)
    start = int(n * 0.2)
    end = int(n * 0.8)
    if end <= start:
        return None

    middle = profile[start:end]
    min_idx = start + np.argmin(middle)
    min_val = profile[min_idx]

    # The wall should be significantly darker than the surrounding green
    # Use the mean of the green areas (not the wall itself) as reference
    avg_val = profile.mean()
    if min_val > avg_val * 0.8:  # Wall should be at least 20% darker
        return None

    if axis == 'vertical':
        # Split at the dark column
        left_w = min_idx
        right_w = w - min_idx
        if left_w < 30 or right_w < 30:
            return None
        # Check both halves are valid sizes
        if _is_valid_size(left_w, h) and _is_valid_size(right_w, h):
            return [
                {"x": x, "y": y, "w": left_w, "h": h,
                 "area": left_w * h, "contour": None},
                {"x": x + min_idx, "y": y, "w": right_w, "h": h,
                 "area": right_w * h, "contour": None},
            ]
    else:
        # Split at the dark row
        top_h = min_idx
        bottom_h = h - min_idx
        if top_h < 30 or bottom_h < 30:
            return None
        if _is_valid_size(w, top_h) and _is_valid_size(w, bottom_h):
            return [
                {"x": x, "y": y, "w": w, "h": top_h,
                 "area": w * top_h, "contour": None},
                {"x": x, "y": y + min_idx, "w": w, "h": bottom_h,
                 "area": w * bottom_h, "contour": None},
            ]

    return None


def ocr_unit_id(img_rgb, unit, padding=2):
    """OCR the unit ID from a cropped region of the image.

    Uses multiple OCR strategies and picks the best result.
    Key insight: feeding GRAYSCALE directly to Tesseract (letting it handle
    binarization) works much better than manual thresholding, especially
    for distinguishing similar-looking digits like 5 vs 9.
    """
    x, y, w, h = unit["x"], unit["y"], unit["w"], unit["h"]

    # Crop the unit region — use minimal padding to preserve edge digits
    y1 = max(0, y + padding)
    y2 = min(img_rgb.shape[0], y + h - padding)
    x1 = max(0, x + padding)
    x2 = min(img_rgb.shape[1], x + w - padding)

    if x2 <= x1 or y2 <= y1:
        return ""

    crop = img_rgb[y1:y2, x1:x2]
    gray = cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY)

    results = []

    # Primary strategy: Grayscale direct — let Tesseract handle binarization
    # This preserves subtle stroke differences (e.g., 5 vs 9) that manual
    # thresholding destroys. Uses OEM 1 (LSTM only) for best accuracy.
    for scale in [4, 6]:
        large = cv2.resize(gray, None, fx=scale, fy=scale,
                           interpolation=cv2.INTER_LANCZOS4)
        bordered = cv2.copyMakeBorder(large, 30, 30, 30, 30,
                                       cv2.BORDER_CONSTANT, value=200)
        config = "--oem 1 --psm 7 -c tessedit_char_whitelist=0123456789"
        text = pytesseract.image_to_string(bordered, config=config).strip()
        cleaned = "".join(c for c in text if c.isdigit())
        if cleaned:
            results.append(cleaned)

    # Fallback strategy: Binary threshold (Otsu) for cases where grayscale
    # doesn't work well (e.g., very low contrast)
    _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    large = cv2.resize(otsu, None, fx=4, fy=4, interpolation=cv2.INTER_NEAREST)
    bordered = cv2.copyMakeBorder(large, 30, 30, 30, 30, cv2.BORDER_CONSTANT, value=0)
    final = cv2.bitwise_not(bordered)
    config = "--oem 3 --psm 7 -c tessedit_char_whitelist=0123456789"
    text = pytesseract.image_to_string(final, config=config).strip()
    cleaned = "".join(c for c in text if c.isdigit())
    if cleaned:
        results.append(cleaned)

    # Pick the best result
    return _pick_best_id(results)


def _pick_best_id(candidates):
    """Pick the best unit ID from multiple OCR attempts.

    Heuristic: most unit IDs are 3 digits. Prefer 3-digit results,
    then pick the most frequently occurring answer. The first entries
    in the list come from the most reliable strategies.
    """
    if not candidates:
        return ""

    from collections import Counter
    counts = Counter(candidates)

    # Prefer 3-digit IDs (most common in these maps)
    three_digit = {k: v for k, v in counts.items() if len(k) == 3}
    if three_digit:
        # If there's a clear winner, use it
        best = max(three_digit, key=three_digit.get)
        # If tied, prefer the result from the primary (grayscale) strategy
        if three_digit[best] == 1 and candidates[0] and len(candidates[0]) == 3:
            return candidates[0]
        return best

    # Fall back to 2-digit IDs
    two_digit = {k: v for k, v in counts.items() if len(k) == 2}
    if two_digit:
        return max(two_digit, key=two_digit.get)

    # Fall back to first non-empty result (from primary strategy)
    return candidates[0] if candidates else ""


def detect_site_features(img, hsv):
    """Detect non-unit features: elevator (blue), stairs, office, yellow/special."""
    features = []

    # Blue regions (elevator)
    blue_mask = cv2.inRange(hsv, BLUE_LOWER, BLUE_UPPER)
    blue_contours, _ = cv2.findContours(blue_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for c in blue_contours:
        area = cv2.contourArea(c)
        if area < 500:
            continue
        x, y, w, h = cv2.boundingRect(c)
        features.append({
            "type": "elevator",
            "x": x, "y": y, "w": w, "h": h,
        })

    # Yellow/orange regions (special units or highlights)
    yellow_mask = cv2.inRange(hsv, YELLOW_LOWER, YELLOW_UPPER)
    yellow_contours, _ = cv2.findContours(yellow_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for c in yellow_contours:
        area = cv2.contourArea(c)
        if area < 500:
            continue
        x, y, w, h = cv2.boundingRect(c)
        features.append({
            "type": "highlight",
            "x": x, "y": y, "w": w, "h": h,
        })

    # Detect "OFFICE" text region via template matching or OCR
    # For now, detect large white/light rectangular regions with text
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # The office is a white rectangle with "OFFICE" text
    _, white_mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)
    white_contours, _ = cv2.findContours(white_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for c in white_contours:
        area = cv2.contourArea(c)
        if area < 5000 or area > 500000:
            continue
        x, y, w, h = cv2.boundingRect(c)
        # Check if this region contains "OFFICE" text
        crop = gray[y:y+h, x:x+w]
        text = pytesseract.image_to_string(crop, config="--psm 7").strip().upper()
        if "OFFICE" in text:
            features.append({
                "type": "office",
                "label": "OFFICE",
                "x": x, "y": y, "w": w, "h": h,
            })

    return features


def fix_ocr_errors(units, expected_range=None):
    """Post-process OCR results to fix systematic misreads.

    Known OCR confusion patterns in bold sans-serif fonts:
    - '5' ↔ '9' (most common with this font)
    - '6' ↔ '8'
    - '3' ↔ '8'
    - '0' ↔ 'O' (already handled by digit whitelist)

    If expected_range is given (e.g., "400-589"), IDs outside the range
    are corrected by trying common digit substitutions.
    """
    if not expected_range:
        return units

    # Parse expected range
    try:
        range_start, range_end = map(int, expected_range.split("-"))
    except ValueError:
        print(f"  Warning: Invalid expected range '{expected_range}', skipping OCR correction")
        return units

    # Common OCR digit confusions (bidirectional)
    CONFUSIONS = {
        '5': ['9'], '9': ['5'],
        '6': ['8'], '8': ['6', '3'],
        '3': ['8'], '1': ['7'], '7': ['1'],
    }

    fixed_count = 0
    for unit in units:
        uid = unit["id"]
        if not uid or not uid.isdigit():
            continue

        num = int(uid)
        if range_start <= num <= range_end:
            continue  # Already in range, no fix needed

        # Try all possible single and multi-digit substitutions
        best_fix = _find_ocr_fix(uid, CONFUSIONS, range_start, range_end)

        # Also handle dropped leading digit (e.g., "77" should be "477")
        if not best_fix and len(uid) < 3:
            for prefix in range(1, 10):
                padded = str(prefix) + uid.zfill(2)
                if padded.isdigit():
                    pnum = int(padded)
                    if range_start <= pnum <= range_end:
                        best_fix = padded
                        break

        if best_fix:
            unit["id_original_ocr"] = uid
            unit["id"] = best_fix
            fixed_count += 1

    if fixed_count:
        print(f"  Fixed {fixed_count} OCR misreads using expected range {expected_range}")

    return units


def _find_ocr_fix(uid, confusions, range_start, range_end):
    """Try substituting confused digits (single and multi) to find a valid ID."""
    from itertools import product

    # Build list of possible replacements per position
    options_per_pos = []
    for digit in uid:
        alts = [digit]  # original digit is always an option
        if digit in confusions:
            alts.extend(confusions[digit])
        options_per_pos.append(alts)

    # Try all combinations (skip the original)
    for combo in product(*options_per_pos):
        candidate = "".join(combo)
        if candidate == uid:
            continue  # Skip original
        if candidate.isdigit():
            cnum = int(candidate)
            if range_start <= cnum <= range_end:
                return candidate

    return None


# ---------------------------------------------------------------------------
# Valid unit sizes at Richland (from planning/richland-unit-mix.pdf)
# Format: (width_ft, height_ft) — always smaller dim first
# ---------------------------------------------------------------------------
VALID_SIZES_FT = [
    (5, 5), (5, 10), (5, 15),
    (7.6, 10),
    (10, 10), (10, 15), (10, 20), (10, 25), (10, 30), (10, 40),
]


def _px_to_ft(px):
    """Map pixel dimension to nearest standard foot value."""
    if px <= 55:
        return 0
    elif px <= 95:
        return 5
    elif px <= 140:
        return 7.6
    elif px <= 200:
        return 10
    elif px <= 290:
        return 15
    elif px <= 370:
        return 20
    elif px <= 460:
        return 25
    elif px <= 560:
        return 30
    elif px <= 700:
        return 40
    return -1


def _ft_to_px_range(ft):
    """Return the expected pixel range for a given foot measurement."""
    ranges = {
        5:   (60, 90),
        7.6: (100, 135),
        10:  (145, 175),
        15:  (220, 270),
        20:  (310, 350),
        25:  (390, 440),
        30:  (470, 520),
        40:  (620, 680),
    }
    return ranges.get(ft, (0, 0))


def _is_valid_size(w_px, h_px):
    """Check if pixel dimensions map to a valid Richland unit size."""
    w_ft = _px_to_ft(w_px)
    h_ft = _px_to_ft(h_px)
    if w_ft <= 0 or h_ft <= 0:
        return False
    dims = tuple(sorted([w_ft, h_ft]))
    return dims in VALID_SIZES_FT


def split_oversized_units(units, img_rgb, green_mask):
    """Split detected units whose dimensions don't match any valid size.

    For each oversized/invalid unit, try splitting along the longer axis
    into 2 or 3 parts. If the resulting parts match valid sizes, replace
    the original with the splits. The splits inherit the original's position
    and divide the space evenly.

    This handles the common case where two adjacent 10x15 units merge into
    one 10x30, or two 5x5 units merge into one 5x10-ish shape.
    """
    final = []
    split_count = 0

    for unit in units:
        w, h = unit["w"], unit["h"]

        if _is_valid_size(w, h):
            final.append(unit)
            continue

        # Try splitting along the longer axis into 2 parts
        splits = _try_split(unit, 2)
        if splits:
            final.extend(splits)
            split_count += 1
            continue

        # Try splitting into 3 parts
        splits = _try_split(unit, 3)
        if splits:
            final.extend(splits)
            split_count += 1
            continue

        # Can't split — keep original (might be an unusual but real unit)
        final.append(unit)

    if split_count:
        print(f"  Split {split_count} oversized contours into valid units")

    return final


def _try_split(unit, n_parts):
    """Try splitting a unit into n_parts along its longer axis."""
    x, y, w, h = unit["x"], unit["y"], unit["w"], unit["h"]

    # Split along the longer dimension
    if w >= h:
        # Split horizontally (along width)
        part_w = w // n_parts
        remainder = w - part_w * n_parts
        parts = []
        cx = x
        for i in range(n_parts):
            pw = part_w + (1 if i < remainder else 0)
            parts.append({"x": cx, "y": y, "w": pw, "h": h,
                          "area": pw * h, "contour": None})
            cx += pw
    else:
        # Split vertically (along height)
        part_h = h // n_parts
        remainder = h - part_h * n_parts
        parts = []
        cy = y
        for i in range(n_parts):
            ph = part_h + (1 if i < remainder else 0)
            parts.append({"x": x, "y": cy, "w": w, "h": ph,
                          "area": w * ph, "contour": None})
            cy += ph

    # Check if ALL resulting parts are valid sizes
    if all(_is_valid_size(p["w"], p["h"]) for p in parts):
        return parts

    return None


def normalize_coordinates(units, features, img_width, img_height, target_width=None):
    """
    Normalize all coordinates to a consistent coordinate space.
    If target_width is given, scale all coordinates proportionally.
    Otherwise, use image pixel coordinates directly.
    """
    if target_width is None:
        return units, features, img_width, img_height

    scale = target_width / img_width
    target_height = int(img_height * scale)

    for u in units:
        u["x"] = round(u["x"] * scale)
        u["y"] = round(u["y"] * scale)
        u["w"] = round(u["w"] * scale)
        u["h"] = round(u["h"] * scale)

    for f in features:
        f["x"] = round(f["x"] * scale)
        f["y"] = round(f["y"] * scale)
        f["w"] = round(f["w"] * scale)
        f["h"] = round(f["h"] * scale)

    return units, features, target_width, target_height


def generate_debug_image(img, units, features, output_path):
    """Draw detected units and features on a copy of the original image."""
    debug = img.copy()

    for u in units:
        x, y, w, h = u["x"], u["y"], u["w"], u["h"]
        uid = u.get("id", "?")

        # Draw rectangle
        cv2.rectangle(debug, (x, y), (x + w, y + h), (0, 0, 255), 3)

        # Draw ID text
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 1.0
        thickness = 2
        text_size = cv2.getTextSize(uid, font, font_scale, thickness)[0]
        text_x = x + (w - text_size[0]) // 2
        text_y = y + (h + text_size[1]) // 2
        cv2.putText(debug, uid, (text_x, text_y), font, font_scale, (0, 0, 255), thickness)

    for f in features:
        x, y, w, h = f["x"], f["y"], f["w"], f["h"]
        ftype = f["type"]
        color = {
            "elevator": (255, 200, 0),
            "highlight": (0, 200, 255),
            "office": (255, 255, 255),
            "stairs": (200, 100, 255),
        }.get(ftype, (128, 128, 128))
        cv2.rectangle(debug, (x, y), (x + w, y + h), color, 4)
        cv2.putText(debug, ftype, (x + 5, y + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

    cv2.imwrite(str(output_path), debug)
    print(f"Debug image saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Extract floor plan data from site map PNG")
    parser.add_argument("input", help="Path to the site map PNG file")
    parser.add_argument("--output", "-o", required=True, help="Output JSON file path")
    parser.add_argument("--debug", action="store_true", help="Generate debug overlay image")
    parser.add_argument("--target-width", type=int, default=None,
                        help="Scale coordinates to this target width (e.g., 1200 for the web map)")
    parser.add_argument("--floor-name", default="Ground Floor", help="Name for this floor")
    parser.add_argument("--floor-id", default="floor-1", help="ID for this floor")
    parser.add_argument("--expected-range", default=None,
                        help="Expected unit ID range (e.g., '400-589'). "
                             "Used to fix systematic OCR misreads like 5→9.")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}")
        sys.exit(1)

    print(f"Loading image: {input_path}")
    img = cv2.imread(str(input_path))
    if img is None:
        print(f"Error: Could not read image: {input_path}")
        sys.exit(1)

    img_h, img_w = img.shape[:2]
    print(f"Image dimensions: {img_w} x {img_h}")

    # Convert to HSV and RGB
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Estimate scale factor (images are ~4x the logical coordinate space)
    scale_factor = img_w / 1200  # assuming ~1200px logical width

    # Step 1: Extract unit rectangles
    print("Detecting unit rectangles...")
    raw_units, green_mask = extract_units(img, hsv, scale_factor)
    print(f"  Found {len(raw_units)} unit contours")

    # Step 1.5: Split oversized/merged units
    print("Splitting oversized contours...")
    raw_units = split_oversized_units(raw_units, img_rgb, green_mask)
    print(f"  After splitting: {len(raw_units)} units")

    # Step 1.6: Split units with visible internal walls
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    print("Checking for internal walls in ambiguous units...")
    raw_units = split_by_internal_walls(raw_units, gray, green_mask)
    print(f"  After wall-splitting: {len(raw_units)} units")

    # Step 1.7: Rescue missed small (5x5) units
    print("Rescuing missed small units...")
    rescued = rescue_small_units(img, hsv, raw_units)
    if rescued:
        print(f"  Rescued {len(rescued)} additional small units")
        raw_units.extend(rescued)
    print(f"  Total after rescue: {len(raw_units)} units")

    # Step 2: OCR unit IDs
    print("Reading unit IDs via OCR...")
    for i, unit in enumerate(raw_units):
        uid = ocr_unit_id(img_rgb, unit)
        unit["id"] = uid
        if (i + 1) % 50 == 0:
            print(f"  Processed {i + 1}/{len(raw_units)} units...")
    print(f"  OCR complete. {sum(1 for u in raw_units if u['id'])} units with IDs detected")

    # Step 3: Detect site features
    print("Detecting site features...")
    features = detect_site_features(img, hsv)
    print(f"  Found {len(features)} site features: {[f['type'] for f in features]}")

    # Step 3.5: Fix OCR errors using expected range
    if args.expected_range:
        print(f"Applying OCR corrections for expected range {args.expected_range}...")
        raw_units = fix_ocr_errors(raw_units, args.expected_range)

    # Step 4: Normalize coordinates
    units_out = []
    for u in raw_units:
        entry = {
            "id": u["id"],
            "x": int(u["x"]),
            "y": int(u["y"]),
            "w": int(u["w"]),
            "h": int(u["h"]),
        }
        if "id_original_ocr" in u:
            entry["id_original_ocr"] = u["id_original_ocr"]
        units_out.append(entry)

    # Sort by ID (numeric if possible)
    def sort_key(u):
        try:
            return int(u["id"])
        except (ValueError, TypeError):
            return 999999

    units_out.sort(key=sort_key)

    units_out, features, floor_w, floor_h = normalize_coordinates(
        units_out, features, img_w, img_h, args.target_width
    )

    # Step 5: Build output
    output = {
        "floor": {
            "id": args.floor_id,
            "name": args.floor_name,
            "width": floor_w,
            "height": floor_h,
            "sourceImageWidth": img_w,
            "sourceImageHeight": img_h,
        },
        "units": units_out,
        "siteFeatures": features,
        "stats": {
            "totalUnits": len(units_out),
            "unitsWithId": sum(1 for u in units_out if u["id"]),
            "unitsMissingId": sum(1 for u in units_out if not u["id"]),
        },
    }

    # Write JSON
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\nJSON output saved to: {output_path}")
    print(f"  Total units: {output['stats']['totalUnits']}")
    print(f"  Units with ID: {output['stats']['unitsWithId']}")
    print(f"  Units missing ID: {output['stats']['unitsMissingId']}")

    # Step 6: Debug image
    if args.debug:
        debug_path = input_path.with_suffix(".debug.png")
        generate_debug_image(img, units_out if not args.target_width else raw_units,
                             features if not args.target_width else detect_site_features(img, hsv),
                             debug_path)
        # Also generate a smaller version for easy viewing
        if img_w > 2000:
            debug_img = cv2.imread(str(debug_path))
            scale = 1200 / img_w
            small = cv2.resize(debug_img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
            small_path = input_path.with_suffix(".debug-small.png")
            cv2.imwrite(str(small_path), small)
            print(f"Debug image (small) saved to: {small_path}")

    # Print sample units
    print("\nSample units (first 10):")
    for u in units_out[:10]:
        print(f"  Unit {u['id']:>4s}  x={u['x']:>5d}  y={u['y']:>5d}  w={u['w']:>4d}  h={u['h']:>4d}")

    # Print units missing IDs
    missing = [u for u in units_out if not u["id"]]
    if missing:
        print(f"\nUnits missing IDs ({len(missing)}):")
        for u in missing[:20]:
            print(f"  x={u['x']:>5d}  y={u['y']:>5d}  w={u['w']:>4d}  h={u['h']:>4d}")


if __name__ == "__main__":
    main()
