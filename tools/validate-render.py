#!/usr/bin/env python3
"""
Validation Renderer
====================
Takes extracted floor plan JSON and renders it into a fresh image from scratch.
Compare the rendered image side-by-side with the original PNG to validate
that the extraction is 1:1 accurate.

Usage:
  python validate-render.py <floor.json> --original <original.png> --output <rendered.png>

Also generates a side-by-side comparison image.
"""

import argparse
import json
import sys
from pathlib import Path

import cv2
import numpy as np


# Match the original map's visual style
UNIT_GREEN = (87, 217, 126)   # BGR - the dominant green from the maps
UNIT_BORDER = (40, 40, 40)     # Dark border lines between units
TEXT_COLOR = (30, 30, 30)      # Dark text for unit IDs
BG_COLOR = (255, 255, 255)     # White background (aisles/paths)
ELEVATOR_BLUE = (200, 180, 60) # BGR - cyan/blue for elevator
HIGHLIGHT_YELLOW = (30, 210, 255)  # BGR - yellow/orange highlights


def render_floor(data, img_width, img_height):
    """Render the extracted floor plan data into a fresh image."""
    # Create blank white canvas
    img = np.full((img_height, img_width, 3), BG_COLOR, dtype=np.uint8)

    units = data["units"]
    features = data.get("siteFeatures", [])

    # Draw units as filled green rectangles with dark borders
    for unit in units:
        x, y, w, h = unit["x"], unit["y"], unit["w"], unit["h"]
        uid = unit.get("id", "")

        # Filled green rectangle
        cv2.rectangle(img, (x, y), (x + w, y + h), UNIT_GREEN, -1)

        # Dark border
        cv2.rectangle(img, (x, y), (x + w, y + h), UNIT_BORDER, 2)

        # Unit ID text centered in the rectangle
        if uid:
            font = cv2.FONT_HERSHEY_SIMPLEX
            # Scale font based on unit size
            font_scale = min(w, h) / 80.0
            font_scale = max(0.4, min(font_scale, 1.2))
            thickness = max(1, int(font_scale * 2))

            text_size = cv2.getTextSize(uid, font, font_scale, thickness)[0]
            text_x = x + (w - text_size[0]) // 2
            text_y = y + (h + text_size[1]) // 2
            cv2.putText(img, uid, (text_x, text_y), font, font_scale,
                        TEXT_COLOR, thickness, cv2.LINE_AA)

    # Draw site features
    for feat in features:
        x, y, w, h = feat["x"], feat["y"], feat["w"], feat["h"]
        ftype = feat.get("type", "")

        if ftype == "elevator":
            cv2.rectangle(img, (x, y), (x + w, y + h), ELEVATOR_BLUE, -1)
            cv2.rectangle(img, (x, y), (x + w, y + h), UNIT_BORDER, 2)
        elif ftype == "highlight":
            cv2.rectangle(img, (x, y), (x + w, y + h), HIGHLIGHT_YELLOW, -1)
            cv2.rectangle(img, (x, y), (x + w, y + h), UNIT_BORDER, 2)
        elif ftype == "office":
            cv2.rectangle(img, (x, y), (x + w, y + h), BG_COLOR, -1)
            cv2.rectangle(img, (x, y), (x + w, y + h), UNIT_BORDER, 2)
            label = feat.get("label", "OFFICE")
            font_scale = 0.6
            text_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, 2)[0]
            text_x = x + (w - text_size[0]) // 2
            text_y = y + (h + text_size[1]) // 2
            cv2.putText(img, label, (text_x, text_y), cv2.FONT_HERSHEY_SIMPLEX,
                        font_scale, TEXT_COLOR, 2, cv2.LINE_AA)

    return img


def create_comparison(original, rendered, scale=None):
    """Create a side-by-side comparison image."""
    h1, w1 = original.shape[:2]
    h2, w2 = rendered.shape[:2]

    # Match heights
    if h1 != h2 or w1 != w2:
        rendered = cv2.resize(rendered, (w1, h1), interpolation=cv2.INTER_AREA)

    # Add labels
    labeled_orig = original.copy()
    labeled_rend = rendered.copy()
    cv2.putText(labeled_orig, "ORIGINAL", (20, 60),
                cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 255), 4, cv2.LINE_AA)
    cv2.putText(labeled_rend, "RENDERED FROM JSON", (20, 60),
                cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 255), 4, cv2.LINE_AA)

    # Side by side with a divider
    divider = np.full((h1, 10, 3), (0, 0, 200), dtype=np.uint8)
    comparison = np.hstack([labeled_orig, divider, labeled_rend])

    # Scale down if needed
    if scale:
        comparison = cv2.resize(comparison, None, fx=scale, fy=scale,
                                interpolation=cv2.INTER_AREA)

    return comparison


def main():
    parser = argparse.ArgumentParser(
        description="Render extracted floor plan JSON into an image for validation")
    parser.add_argument("input", help="Path to the extracted floor JSON file")
    parser.add_argument("--original", required=True,
                        help="Path to the original site map PNG for comparison")
    parser.add_argument("--output", "-o", default=None,
                        help="Output rendered image path (default: <input>.rendered.png)")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: JSON file not found: {input_path}")
        sys.exit(1)

    original_path = Path(args.original)
    if not original_path.exists():
        print(f"Error: Original image not found: {original_path}")
        sys.exit(1)

    # Load data
    with open(input_path) as f:
        data = json.load(f)

    floor_info = data["floor"]
    img_w = floor_info["sourceImageWidth"]
    img_h = floor_info["sourceImageHeight"]

    print(f"Floor: {floor_info['name']}")
    print(f"Units: {len(data['units'])}")
    print(f"Rendering at {img_w} x {img_h}...")

    # Render from JSON
    rendered = render_floor(data, img_w, img_h)

    # Save rendered image
    output_path = Path(args.output) if args.output else input_path.with_suffix(".rendered.png")
    cv2.imwrite(str(output_path), rendered)
    print(f"Rendered image saved to: {output_path}")

    # Load original for comparison
    original = cv2.imread(str(original_path))
    if original is None:
        print(f"Warning: Could not load original image for comparison")
        return

    # Create side-by-side comparison (scaled down for viewability)
    scale = 1200 / (img_w * 2 + 10)  # fit both images in ~1200px width
    comparison = create_comparison(original, rendered, scale=scale)
    comparison_path = input_path.with_suffix(".comparison.png")
    cv2.imwrite(str(comparison_path), comparison)
    print(f"Side-by-side comparison saved to: {comparison_path}")

    # Also create a difference image (highlights misalignments)
    if original.shape == rendered.shape:
        diff = cv2.absdiff(original, rendered)
        # Amplify differences for visibility
        diff_gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
        _, diff_thresh = cv2.threshold(diff_gray, 30, 255, cv2.THRESH_BINARY)
        # Color the differences red on the original
        diff_overlay = original.copy()
        diff_overlay[diff_thresh > 0] = [0, 0, 255]  # Red where different
        diff_overlay_small = cv2.resize(diff_overlay, None, fx=1200/img_w, fy=1200/img_w,
                                         interpolation=cv2.INTER_AREA)
        diff_path = input_path.with_suffix(".diff.png")
        cv2.imwrite(str(diff_path), diff_overlay_small)
        print(f"Difference overlay saved to: {diff_path}")
        print(f"  (Red areas = misalignment between original and rendered)")

        # Calculate match percentage
        total_pixels = diff_thresh.shape[0] * diff_thresh.shape[1]
        matching_pixels = total_pixels - cv2.countNonZero(diff_thresh)
        match_pct = 100.0 * matching_pixels / total_pixels
        print(f"\n  Pixel match: {match_pct:.1f}%")
    else:
        print(f"Warning: Image dimensions don't match, skipping diff analysis")


if __name__ == "__main__":
    main()
