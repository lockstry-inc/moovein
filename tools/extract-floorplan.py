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
    """Detect green unit rectangles and extract bounding boxes."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Step 1: Get green mask
    mask = cv2.inRange(hsv, GREEN_LOWER, GREEN_UPPER)

    # Step 2: Detect the dark border lines between adjacent units.
    # Adjacent units are separated by thin dark lines (~4px at 4800px resolution).
    # Detect edges in the grayscale image and use them as separators.
    edges = cv2.Canny(gray, 50, 150)
    # Dilate edges to make the separating lines thicker and more reliable
    edge_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    edges_thick = cv2.dilate(edges, edge_kernel, iterations=2)

    # Step 3: Subtract edge lines from the green mask to break apart merged units
    mask_separated = cv2.bitwise_and(mask, cv2.bitwise_not(edges_thick))

    # Step 4: Clean up small noise from the subtraction
    # Open operation (erode then dilate) removes tiny fragments
    clean_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    mask_separated = cv2.morphologyEx(mask_separated, cv2.MORPH_OPEN, clean_kernel, iterations=1)

    # Step 5: Find contours
    contours, _ = cv2.findContours(mask_separated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    units = []
    # Min/max area thresholds (in high-res pixels)
    # At 4800x5200, smallest unit (locker) is roughly 130x120 = ~15,600 px^2
    # Use generous bounds
    min_area = 3000
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
        if w < 20 or h < 20:
            continue

        units.append({
            "x": x,
            "y": y,
            "w": w,
            "h": h,
            "area": area,
            "contour": contour,
        })

    return units, mask_separated


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
            "x": u["x"],
            "y": u["y"],
            "w": u["w"],
            "h": u["h"],
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
