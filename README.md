# Moove In — Self Storage

Modern self-storage booking experience. Interactive facility map, multi-floor support, 7-step checkout.

## Quick Start

```bash
npm install
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build locally |

## Tech Stack

- **React 19** + **TypeScript** + **Vite 7**
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin)
- **Zustand** (state management — facility store + checkout store)
- Single-page app, no router

## Project Structure

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Root layout (intro → map → checkout)
├── index.css                   # Tailwind + design tokens + unit CSS
├── types/                      # TypeScript interfaces
├── data/                       # Static data (unit types, addons, lease terms)
├── stores/                     # Zustand stores (facility + checkout)
├── hooks/                      # useMediaQuery, useMapControls
└── components/
    ├── layout/                 # Topbar, IntroOverlay
    ├── map/                    # FacilityMap, Unit, Tooltip, Filters, Controls
    ├── checkout/               # Panel, Progress, 7 step components
    ├── mobile/                 # UnitCardList, UnitCard, FilterChips
    └── shared/                 # SignatureCanvas, OrderSummary

public/data/                    # Facility JSON (generated from extraction tool)
tools/                          # Floor plan extraction pipeline (Python/OpenCV)
```

## Floor Plan Extraction

The `tools/extract-floorplan.py` pipeline converts site map PNGs into the unit coordinate JSON that powers the interactive map.

```bash
pip install opencv-python-headless pytesseract numpy Pillow
apt install tesseract-ocr  # if not already installed

# Ground Floor
python tools/extract-floorplan.py richland-1.png \
  --output public/data/richland-floor1.json \
  --floor-name "Ground Floor" --floor-id "floor-1" \
  --expected-range "1-614" --debug

# 2nd Floor
python tools/extract-floorplan.py richland-2.png \
  --output public/data/richland-floor2.json \
  --floor-name "2nd Floor" --floor-id "floor-2" \
  --expected-range "400-589" --debug
```

See `tools/EXTRACTION-STATUS.md` for current accuracy and known issues.

## Facility Data

`public/data/facility-richland.json` contains both floors with unit coordinates, types, occupancy, and features. This is the single source of truth consumed by the React app.

Unit metadata (type, occupancy, features) for floor 1 comes from the original `storage.html`. Floor 2 uses inferred types based on unit dimensions.

## Design System

Dark theme tokens defined in `src/index.css` via Tailwind `@theme`:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#06070a` | Page background |
| `--color-surface` | `#0e1014` | Cards, panels |
| `--color-accent` | `#2dd4a0` | Vacant units, CTAs, active states |
| `--color-occ` | `#ef4468` | Occupied units |
| `--color-sel` | `#4fc4f0` | Selected unit highlight |

Fonts: DM Sans (UI), Playfair Display (headings).
