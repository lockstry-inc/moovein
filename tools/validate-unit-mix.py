#!/usr/bin/env python3
"""
Validate extracted unit data against ground truth.

When run without --expected-*, this just reports detected counts per size.
When an accurate unit mix becomes available, pass expected counts via flags
to compare detected vs expected.

Usage:
  python tools/validate-unit-mix.py                          # report only
  python tools/validate-unit-mix.py --floor1 output/f1.json  # single floor
  python tools/validate-unit-mix.py --expected-total 669     # with target
"""

import json
from collections import Counter

# ---------------------------------------------------------------------------
# Ground truth: currently unavailable (old unit mix was inaccurate).
# When an accurate unit ID → size mapping is available, update this dict
# or pass --expected-total / --expected-floor1 / --expected-floor2 flags.
# ---------------------------------------------------------------------------

# Placeholder — fill in when accurate data is available
GROUND_TRUTH_MATRIX = {
    # '5x5':    (F1, F2, B2, B3, Total),
    # '5x10':   (...),
    # etc.
}

EXPECTED_FLOOR1 = {}
EXPECTED_FLOOR2 = {}
EXPECTED_FLOOR1_TOTAL = 0
EXPECTED_FLOOR2_TOTAL = 0


def px_to_feet(px):
    """Map a pixel dimension to the nearest standard foot measurement."""
    if px <= 55:
        return 0       # too small (noise)
    elif px <= 95:
        return 5        # 73-77px → 5 feet
    elif px <= 140:
        return 7.6      # 115-119px → 7'6"
    elif px <= 200:
        return 10       # 155-165px → 10 feet
    elif px <= 290:
        return 15       # 241-249px → 15 feet
    elif px <= 370:
        return 20       # 325-335px → 20 feet
    elif px <= 460:
        return 25       # 405-421px → 25 feet
    elif px <= 560:
        return 30       # 491-500px → 30 feet
    elif px <= 700:
        return 40       # ~650px → 40 feet
    else:
        return -1       # unmapped


def classify_unit_size(w_px, h_px):
    """Convert pixel dimensions to a real unit size string like '10x15'."""
    w_ft = px_to_feet(w_px)
    h_ft = px_to_feet(h_px)

    if w_ft <= 0 or h_ft <= 0:
        return 'unknown'

    # Normalize: smaller dimension first
    dims = sorted([w_ft, h_ft])

    # Format: use "7.6" for 7'6"
    if dims[0] == int(dims[0]) and dims[1] == int(dims[1]):
        return f'{int(dims[0])}x{int(dims[1])}'
    else:
        return f'{dims[0]}x{int(dims[1])}'


def validate_floor(floor_data, expected, floor_label):
    """Compare detected units against expected counts."""
    units = floor_data['units']

    # Classify each unit by real size
    detected = Counter()
    odd_sizes = []
    for u in units:
        size = classify_unit_size(u['w'], u['h'])
        detected[size] += 1
        if size not in expected and size != 'unknown':
            odd_sizes.append((u['id'], u['w'], u['h'], size))

    # All known sizes
    all_sizes = sorted(set(list(expected.keys()) + list(detected.keys())),
                       key=lambda s: (0 if s != 'unknown' else 1,
                                      float(s.split('x')[0]) if s != 'unknown' else 999,
                                      float(s.split('x')[1]) if s != 'unknown' else 999))

    print(f'\n{"="*60}')
    print(f' {floor_label}')
    print(f' Detected: {len(units)} units | Expected: {sum(expected.values())} units')
    print(f'{"="*60}')
    print(f'  {"Size":>10s}  {"Detected":>8s}  {"Expected":>8s}  {"Delta":>8s}  Status')
    print(f'  {"-"*10}  {"-"*8}  {"-"*8}  {"-"*8}  {"-"*8}')

    total_detected = 0
    total_expected = 0
    issues = []

    for size in all_sizes:
        det = detected.get(size, 0)
        exp = expected.get(size, 0)
        delta = det - exp
        total_detected += det
        total_expected += exp

        if size == 'unknown':
            status = 'NOISE' if det > 0 else ''
        elif delta == 0:
            status = 'OK'
        elif delta < 0:
            status = f'MISSING {-delta}'
            issues.append(f'{size}: missing {-delta} units')
        else:
            status = f'EXCESS {delta}'
            if exp == 0:
                status = 'UNEXPECTED'
            issues.append(f'{size}: {delta} excess (likely merged/misclassified)')

        print(f'  {size:>10s}  {det:>8d}  {exp:>8d}  {delta:>+8d}  {status}')

    print(f'  {"-"*10}  {"-"*8}  {"-"*8}  {"-"*8}')
    print(f'  {"TOTAL":>10s}  {total_detected:>8d}  {total_expected:>8d}  {total_detected - total_expected:>+8d}')

    if odd_sizes:
        print(f'\n  Unexpected sizes detected ({len(odd_sizes)} units):')
        for uid, w, h, size in odd_sizes[:15]:
            print(f'    Unit {uid}: {w}x{h}px → {size}')
        if len(odd_sizes) > 15:
            print(f'    ... and {len(odd_sizes) - 15} more')

    if issues:
        print(f'\n  Issues:')
        for issue in issues:
            print(f'    - {issue}')

    return detected, issues


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Validate extraction against unit mix ground truth')
    parser.add_argument('--floor1', help='Path to floor 1 extraction JSON (individual floor file)')
    parser.add_argument('--floor2', help='Path to floor 2 extraction JSON (individual floor file)')
    parser.add_argument('--facility', default='public/data/facility-richland.json',
                        help='Path to combined facility JSON (default)')
    args = parser.parse_args()

    print('Moove In Richland — Unit Mix Validation')
    if not GROUND_TRUTH_MATRIX:
        print('NOTE: No ground truth data configured. Showing detected counts only.')

    all_issues = []
    floors = []

    if args.floor1 or args.floor2:
        # Read individual floor files
        if args.floor1:
            with open(args.floor1) as f:
                data = json.load(f)
            # Individual floor file has {floor: {...}, units: [...], ...}
            floor_data = {'id': data['floor']['id'], 'units': data['units']}
            floors.append(floor_data)
        if args.floor2:
            with open(args.floor2) as f:
                data = json.load(f)
            floor_data = {'id': data['floor']['id'], 'units': data['units']}
            floors.append(floor_data)
    else:
        # Read combined facility file
        with open(args.facility) as f:
            facility = json.load(f)
        floors = facility['floors']

    for floor in floors:
        if floor['id'] == 'floor-1':
            _, issues = validate_floor(floor, EXPECTED_FLOOR1, 'Ground Floor (richland-1.png)')
            all_issues.extend(issues)
        elif floor['id'] == 'floor-2':
            _, issues = validate_floor(floor, EXPECTED_FLOOR2, '2nd Floor (richland-2.png)')
            all_issues.extend(issues)

    # Summary
    total_units = sum(len(f['units']) for f in floors)
    total_expected = 0
    for floor in floors:
        if floor['id'] == 'floor-1':
            total_expected += EXPECTED_FLOOR1_TOTAL
        elif floor['id'] == 'floor-2':
            total_expected += EXPECTED_FLOOR2_TOTAL

    print(f'\n{"="*60}')
    print(f' SUMMARY')
    print(f'{"="*60}')
    print(f'  Total detected: {total_units}')
    print(f'  Total expected: {total_expected}')
    print(f'  Overall delta:  {total_units - total_expected:+d}')
    print(f'  Issues found:   {len(all_issues)}')

    if all_issues:
        print(f'\n  All issues:')
        for issue in all_issues:
            print(f'    - {issue}')
        return 1
    else:
        print(f'\n  All counts match ground truth!')
        return 0


if __name__ == '__main__':
    exit(main())
