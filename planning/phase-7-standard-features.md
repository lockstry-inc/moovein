# Phase 7 — Standard Self-Storage Website Features

> Clean, premium design. Not overbearing. No context overload.

## Context

After researching Extra Space Storage, Public Storage, and CubeSmart, the Moove In landing page is missing several industry-standard sections that every competitive self-storage website includes. This phase adds them selectively — only features that earn their place — with generous whitespace, elegant scroll-triggered animations, and zero visual clutter.

## Competitor Research Summary

| Feature | Extra Space | Public Storage | CubeSmart | Moove In (Current) |
|---------|------------|----------------|-----------|-------------------|
| Location search (hero) | Yes | Yes | Yes | **Yes** |
| How it works / process | Yes | Yes | Yes | **Missing** |
| Unit size guide with "what fits" | Yes (detailed) | Yes (room equivalents) | Yes (videos + cubic ft) | **Partial** (sizes shown, no comparisons) |
| Trust signals / value props | Yes (BBB, 4000+ locations) | Yes (Trustpilot 4.5/5) | Yes (highest service rating) | **Missing** (ValueProps exists but unused) |
| FAQ section | Yes (by topic) | Yes (Help Center) | Yes (dedicated page) | **Missing** |
| Multi-column footer | Yes | Yes | Yes | **Missing** (simple centered footer) |
| Promotions / deals | Yes (First Month Free) | Yes ($1 First Month) | Yes (up to 50% off) | **Partial** (hero badges only) |
| Blog / content hub | Yes (extensive) | Yes | Yes | Not in scope yet |
| Tenant portal | Yes | Yes (app) | Yes (app) | Not in scope yet |
| Live chat | Yes | No | No | Not in scope yet |

## What We're Adding (5 Changes)

### Priority Order

| # | Section | Type | Impact | Complexity |
|---|---------|------|--------|------------|
| 1 | **HowItWorks** | New component | High — reduces friction for first-timers | Low |
| 2 | **StorageTypes** | Enhance existing | Medium — adds "what fits" comparisons + "Popular" badge | Low |
| 3 | **WhyMooveIn** | New component | High — trust signals + value props combined | Low |
| 4 | **FAQ** | New component | High — SEO + reduces support friction | Medium |
| 5 | **LandingFooter** | Enhance existing | Medium — professional multi-column footer | Medium |

### What We're NOT Adding (and why)

- **Blog/content hub** — No content exists yet. Adding empty infrastructure is premature.
- **Tenant portal** — Requires backend/auth. Out of scope for landing page.
- **Live chat** — Third-party integration. Separate project.
- **Deals/promotions page** — Promo badges in hero are sufficient for now. Dedicated page when there's real pricing data from SSM.
- **Size calculator/quiz** — StorageTypes with "what fits" comparisons covers 90% of the value with 10% of the complexity.

---

## Updated Page Section Order

```
LandingNav           (existing, unchanged)
HeroSection          (existing, unchanged)
HowItWorks           ← NEW
LocationMap          (existing, unchanged)
LocationGrid         (existing, unchanged)
StorageTypes         ← ENHANCED (add "what fits" + "Popular" badge)
WhyMooveIn           ← NEW (replaces unused ValueProps.tsx)
FAQ                  ← NEW
LandingFooter        ← ENHANCED (multi-column layout)
```

---

## Section Designs

### 1. HowItWorks

**Purpose:** Reduce anxiety for first-time self-storage renters. "It's this easy."

**Content:**
| Step | Icon | Title | Description |
|------|------|-------|-------------|
| 01 | Magnifying glass | Search | Browse locations near you and compare unit sizes and prices. |
| 02 | Calendar + check | Reserve | Lock in your unit online instantly. No deposit required. |
| 03 | Key | Move In | Show up on your move-in date. We handle the rest. |

**Layout:**
- 3 columns on desktop (`md:grid-cols-3`), stacked on mobile
- Step numbers in accent green (#2dd4a0), 11px uppercase with letter-spacing
- Icons in 56px circles: `bg-surface border border-border`, 24px SVG in accent color
- Subtle connecting line between circles (desktop only): absolute div, `bg-border`
- Max width: 900px (narrow, intimate)
- Scroll animation: fade-up on enter, steps stagger 120ms

---

### 2. StorageTypes Enhancement

**Purpose:** Help users understand which size they need using relatable comparisons.

**Changes to existing component:**
1. New `WHAT_FITS` data: xs→"Walk-in closet", sm→"Studio apartment", md→"1-bedroom apartment", lg→"2-bedroom apartment", xl→"Full house"
2. "Most Popular" accent-green pill badge on Standard (md) card
3. "Comparable to a {size}" line (11px, text-dim) between description and price
4. Subtle accent border on Standard card to draw the eye

**No layout changes.** Existing grid and horizontal scroll preserved.

---

### 3. WhyMooveIn

**Purpose:** Build trust. Combine security features with value propositions.

**Content (6 cards):**
| Feature | Icon | Description |
|---------|------|-------------|
| No Deposit | Shield | Move in without upfront costs. Just your first month's rent. |
| Cancel Anytime | Rotate arrow | Month-to-month flexibility with no long-term commitments. |
| 24/7 Access | Clock | Smart lock-enabled units for round-the-clock entry. |
| HD Surveillance | Video camera | Every facility monitored with high-definition security cameras. |
| Climate Control | Thermometer | Temperature-regulated units available to protect sensitive items. |
| Easy Online Rental | Smartphone | Reserve and manage your unit entirely from your phone. |

**Layout:**
- 3 columns desktop, 2 tablet, 1 mobile
- Cards: `bg-surface border border-border rounded-[14px]`, 22px 18px padding
- Icon containers: 40px square, `rounded-[10px]`, `bg-accent-bg` (green tint), 20px SVG in accent color
- Max width: 900px
- Scroll animation: cards stagger 80ms

**Replaces** the unused `ValueProps.tsx` (which had 4 items with emoji icons). WhyMooveIn expands to 6 items with proper SVG icons and adds security-focused features.

---

### 4. FAQ

**Purpose:** Answer common questions. SEO-friendly. Reduces support inquiries.

**Questions:**
1. How much does a storage unit cost?
2. What are your access hours?
3. What can I store in my unit?
4. Do I need insurance for my storage unit?
5. Can I cancel my reservation?
6. How do I reserve a unit online?
7. Are climate-controlled units available?
8. What happens on move-in day?

**Layout:**
- Clean accordion — items separated by `border-b border-border` only (no card backgrounds)
- Max width: 700px (narrow for comfortable reading ~65 chars/line)
- Question: 15px semibold, full-width button, hover → accent color
- Toggle icon: plus that rotates 45° to become X (spring easing)
- Answer: 13px text-sec, leading-[1.7], smooth height animation via scrollHeight
- Section background: `bg-surface border-t border-border` (visual band differentiating from bg sections)

**Animation:** Smooth height transition at 0.35s with spring easing `cubic-bezier(0.16, 1, 0.3, 1)`.

---

### 5. Enhanced Footer

**Purpose:** Professional multi-column footer with real content.

**Layout (4 columns on desktop, stacked on mobile):**

| Brand | Quick Links | Contact | Legal |
|-------|-------------|---------|-------|
| Moove In Self Storage | Find a Location | (888) 555-MOOV | Privacy Policy |
| Tagline paragraph | Storage Sizes | support@moovein.com | Terms of Service |
| Social icons (FB, IG, X) | FAQ | Mon-Sat 9am-6pm EST | Accessibility |
| | Contact Us | | |

**Design details:**
- Column headers: 12px semibold uppercase with letter-spacing
- Links: 13px text-sec, hover → accent green
- Social icons: 16px stroke SVGs
- Bottom row: copyright (left) + "Find a Location" CTA (right)
- Quick links scroll to relevant page sections via `scrollIntoView`

---

## Shared Infrastructure

### `useInView` Hook

Small shared hook for scroll-triggered entrance animations:
- Uses `IntersectionObserver`
- Returns `{ ref, inView }`
- Threshold: 0.15 (fires when 15% visible)
- `once: true` default (fires once, stays visible)
- File: `src/hooks/useInView.ts`

### Animation Pattern

All new sections use the same entrance animation:
```
opacity: 0 → 1
translateY: 24px → 0
duration: 0.7s
easing: cubic-bezier(0.16, 1, 0.3, 1)
```

Child elements within sections (steps, cards) use staggered delays with:
```
translateY: 16px → 0
duration: 0.5s
stagger: 80-120ms per item
```

---

## Design Principles

1. **Generous whitespace** — `py-20` (80px) on every section
2. **No new colors** — only existing design tokens from `index.css`
3. **Typography hierarchy** — Playfair Display for section headings, DM Sans for everything else
4. **Consistent cards** — same `bg-surface border border-border rounded-[14px] hover:border-border-light`
5. **Inline SVG icons** — no icon library, match existing `viewBox="0 0 24 24"` stroke pattern
6. **Spring easing** — `cubic-bezier(0.16, 1, 0.3, 1)` everywhere
7. **Progressive disclosure** — FAQ accordion hides answers; WhyMooveIn uses compact cards
8. **Dark + light theme** — all new components use CSS custom properties that auto-switch

---

## Files to Create

| File | Description |
|------|-------------|
| `src/hooks/useInView.ts` | Shared scroll-triggered animation hook |
| `src/components/landing/HowItWorks.tsx` | 3-step process section |
| `src/components/landing/WhyMooveIn.tsx` | 6-card trust + value props grid |
| `src/components/landing/FAQ.tsx` | 8-question accordion |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/landing/StorageTypes.tsx` | Add WHAT_FITS data, "Most Popular" badge, "Comparable to" line |
| `src/components/landing/LandingFooter.tsx` | Restructure to 4-column grid layout |
| `src/components/landing/LandingPage.tsx` | Import + compose 3 new sections |

## Files to Delete

| File | Reason |
|------|--------|
| `src/components/landing/ValueProps.tsx` | Never imported, content absorbed into WhyMooveIn |

---

## Implementation Order

1. `useInView` hook (shared dependency)
2. `HowItWorks.tsx` (simplest new component)
3. `WhyMooveIn.tsx` (similar structure, 6-card grid)
4. `FAQ.tsx` (accordion with height animation)
5. Enhance `StorageTypes.tsx`
6. Enhance `LandingFooter.tsx`
7. Wire into `LandingPage.tsx`
8. Delete `ValueProps.tsx`

## Verification

- All sections render on landing page in correct order
- Scroll entrance animations fire once on first view
- FAQ accordion opens/closes smoothly with plus→X rotation
- "Most Popular" badge and accent border on Standard card
- Footer quick links scroll to correct sections
- Mobile: all sections stack cleanly
- Light theme: all sections respect theme toggle
- `npm run build` passes cleanly
