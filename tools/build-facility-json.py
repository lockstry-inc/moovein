#!/usr/bin/env python3
"""
Build Facility JSON
====================
Combines floor extraction JSONs into the production facility-richland.json.
Assigns real unit types based on pixel dimensions and adds mock occupancy/features.

Usage:
  python tools/build-facility-json.py \
    --floor1 tools/validation/richland-floor1-v5.json \
    --floor2 tools/validation/richland-floor2-v3.json \
    --output public/data/facility-richland.json
"""

import argparse
import json
import random
from pathlib import Path


# ---------------------------------------------------------------------------
# Real unit sizes at Richland (from planning/richland-unit-mix.pdf)
# Maps pixel dimensions → size key string
# ---------------------------------------------------------------------------
def px_to_ft(px):
    """Map a pixel dimension to the nearest standard foot measurement."""
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


VALID_TYPES = {
    '5x5', '5x10', '5x15', '7.6x10',
    '10x10', '10x15', '10x20', '10x25', '10x30', '10x40',
}

# Map invalid sizes → nearest valid size
FALLBACK_MAP = {
    '5x7': '5x10',
    '5x25': '5x15',
    '7.6x7': '7.6x10',
    '7.6x15': '10x15',
    '7.6x20': '10x20',
    '15x15': '10x15',
    '15x20': '10x20',
}


def classify_unit(w_px, h_px):
    """Classify a unit by its pixel dimensions → type key like '5x10'."""
    w_ft = px_to_ft(w_px)
    h_ft = px_to_ft(h_px)

    if w_ft <= 0 or h_ft <= 0:
        return '5x5'  # fallback for tiny/unknown

    dims = sorted([w_ft, h_ft])
    # Format: smaller dim first, use "7.6" for 7'6"
    if dims[0] == int(dims[0]) and dims[1] == int(dims[1]):
        raw_type = f'{int(dims[0])}x{int(dims[1])}'
    else:
        raw_type = f'{dims[0]}x{int(dims[1])}'

    # Map invalid types to nearest valid one
    if raw_type not in VALID_TYPES:
        return FALLBACK_MAP.get(raw_type, '10x10')  # default fallback

    return raw_type


def deduplicate_units(units):
    """Remove duplicate/near-duplicate units (from rescue pass overlap).

    Two units are considered duplicates if their centers are within 20px
    and their sizes are similar (within 30%).
    """
    if not units:
        return units

    kept = []
    used = set()

    # Sort by area (largest first) — prefer larger detections
    sorted_units = sorted(enumerate(units), key=lambda x: x[1]['w'] * x[1]['h'], reverse=True)

    for i, unit in sorted_units:
        if i in used:
            continue

        cx = unit['x'] + unit['w'] // 2
        cy = unit['y'] + unit['h'] // 2
        area = unit['w'] * unit['h']

        is_dup = False
        for j, other in sorted_units:
            if j in used or j == i:
                continue
            ocx = other['x'] + other['w'] // 2
            ocy = other['y'] + other['h'] // 2
            oarea = other['w'] * other['h']

            dist = ((cx - ocx) ** 2 + (cy - ocy) ** 2) ** 0.5
            size_ratio = min(area, oarea) / max(area, oarea) if max(area, oarea) > 0 else 0

            if dist < 20 and size_ratio > 0.7:
                # Near-duplicate — mark the smaller one as used
                used.add(j)

        kept.append(unit)
        used.add(i)

    return kept


def build_floor(floor_json, floor_id, floor_name, occupancy_rate=0.65, seed=42):
    """Build a floor entry from extraction JSON."""
    with open(floor_json) as f:
        data = json.load(f)

    raw_units = data['units']
    floor_info = data['floor']

    # Deduplicate
    deduped = deduplicate_units(raw_units)
    print(f"  {floor_name}: {len(raw_units)} raw → {len(deduped)} after dedup")

    # Assign types, occupancy, and features
    rng = random.Random(seed)
    units = []

    for u in deduped:
        unit_type = classify_unit(u['w'], u['h'])

        # Mock occupancy (seeded random for consistency)
        occ = 1 if rng.random() < occupancy_rate else 0

        entry = {
            'id': u['id'] if u['id'] else f"U{u['x']}_{u['y']}",
            'x': u['x'],
            'y': u['y'],
            'w': u['w'],
            'h': u['h'],
            'type': unit_type,
            'occ': occ,
        }

        # Add random features for some units (seeded)
        if unit_type in ('10x10', '10x15', '10x20', '10x25', '10x30', '10x40'):
            if rng.random() < 0.3:
                entry['climate'] = 1
            if rng.random() < 0.15:
                entry['power'] = 1
        if unit_type in ('10x20', '10x25', '10x30', '10x40'):
            if rng.random() < 0.4:
                entry['driveup'] = 1
        if rng.random() < 0.2:
            entry['smartlock'] = 1

        units.append(entry)

    # Sort by ID
    def sort_key(u):
        uid = u['id']
        try:
            return (0, int(uid))
        except (ValueError, TypeError):
            return (1, 0)

    units.sort(key=sort_key)

    # Ensure unique IDs within this floor
    seen_ids = {}
    for u in units:
        uid = u['id']
        if uid in seen_ids:
            seen_ids[uid] += 1
            u['id'] = f"{uid}-{seen_ids[uid]}"
        else:
            seen_ids[uid] = 0

    return {
        'id': floor_id,
        'name': floor_name,
        'width': floor_info['width'] if 'width' in floor_info else floor_info.get('sourceImageWidth', 4800),
        'height': floor_info['height'] if 'height' in floor_info else floor_info.get('sourceImageHeight', 5200),
        'units': units,
        'siteFeatures': data.get('siteFeatures', []),
    }


def main():
    parser = argparse.ArgumentParser(description='Build production facility JSON')
    parser.add_argument('--floor1', required=True, help='Floor 1 extraction JSON')
    parser.add_argument('--floor2', required=True, help='Floor 2 extraction JSON')
    parser.add_argument('--output', '-o', required=True, help='Output facility JSON')
    args = parser.parse_args()

    print("Building facility JSON...")

    floor1 = build_floor(args.floor1, 'floor-1', 'Ground Floor', occupancy_rate=0.65, seed=42)
    floor2 = build_floor(args.floor2, 'floor-2', '2nd Floor', occupancy_rate=0.60, seed=99)

    facility = {
        'id': 'richland',
        'name': 'Moove In Richland',
        'address': '651 S Richland Ave, York, PA 17403',
        'phone': '(717) 900-1700',
        'hours': 'Gate 6AM–10PM',
        'officeHours': {
            'office': [
                {'label': 'Sunday', 'time': 'Closed'},
                {'label': 'Mon–Fri', 'time': '9:30 AM – 5:30 PM'},
                {'label': 'Saturday', 'time': '8:00 AM – 1:00 PM'},
            ],
            'gate': '6:00 AM – 10:00 PM Daily',
        },
        'floors': [floor1, floor2],
    }

    # Stats
    total = len(floor1['units']) + len(floor2['units'])
    vacant_1 = sum(1 for u in floor1['units'] if u['occ'] == 0)
    vacant_2 = sum(1 for u in floor2['units'] if u['occ'] == 0)

    # Type distribution
    from collections import Counter
    types1 = Counter(u['type'] for u in floor1['units'])
    types2 = Counter(u['type'] for u in floor2['units'])

    print(f"\n  Floor 1: {len(floor1['units'])} units ({vacant_1} vacant)")
    for t in sorted(types1.keys()):
        print(f"    {t:>8s}: {types1[t]}")

    print(f"\n  Floor 2: {len(floor2['units'])} units ({vacant_2} vacant)")
    for t in sorted(types2.keys()):
        print(f"    {t:>8s}: {types2[t]}")

    print(f"\n  Total: {total} units ({vacant_1 + vacant_2} vacant)")

    # Write
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(facility, f, indent=2)
    print(f"\n  Saved to: {output_path}")


if __name__ == '__main__':
    main()
