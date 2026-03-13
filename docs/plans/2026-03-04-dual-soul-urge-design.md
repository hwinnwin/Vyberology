# Dual Soul Urge Feature Design

**Date:** 2026-03-04
**Status:** Approved

## Overview

Add a second Soul Urge calculation to every reading: the **Deep Soul Blueprint** (Y treated as consonant), displayed alongside the existing **Active Soul Frequency** (Y treated as vowel). This creates a dual-lens interpretation of soul motivation.

## Approach: Additive Field (Approach A)

Add `soulUrgeDeep: NumValue` as a sibling field to the existing `soulUrge` in `NumerologyNumbers`. Non-breaking — old readings without `soulUrgeDeep` gracefully fall back to showing only Active Soul Frequency.

## Calculation

- **Active Soul Frequency** (`soulUrge`): Vowels = A, E, I, O, U, Y (unchanged)
- **Deep Soul Blueprint** (`soulUrgeDeep`): Vowels = A, E, I, O, U (Y excluded)
- Both preserve master numbers (11, 22, 33) via `preserveMastersEarly = true`

When both values are identical (name contains no Y), show a single card with: "Your soul frequencies are unified — no Y in your birth name."

## Types

```typescript
NumerologyNumbers {
  lifePath: NumValue;
  expression: NumValue;
  soulUrge: NumValue;      // Active Soul Frequency (Y = vowel)
  soulUrgeDeep: NumValue;  // Deep Soul Blueprint (Y = consonant) — NEW
  personality: NumValue;
  maturity: NumValue;
}
```

## UI Display

All pages that currently show Soul Urge will display both variants side-by-side:

```
┌─────────────────────┐  ┌─────────────────────┐
│         7            │  │         8            │
│  Active Soul Freq.   │  │  Deep Soul Blueprint │
└─────────────────────┘  └─────────────────────┘
```

With explanation text beneath:
> Your Active Soul Frequency reveals how your soul is currently expressing.
> Your Deep Soul Blueprint reveals your soul's deeper hunger and destiny.

Pages affected: ReadingResult, RomanceOutlook, CareerOutlook, LyfPath, Compatibility, SharedReading, ReadingCard, PairReadingCard.

## Descriptions

Separate `soulUrgeDeepDescriptions` table with 13 entries (1-9, 11, 22, 33) using "deeper hunger" framing. Must feel meaningfully different from existing `soulUrgeDescriptions`.

## AI Prompt

Update vybe-reading edge function Number Breakdown to include both Soul Urge variants with this framing context:

> This person has an Active Soul Frequency of [X] revealing how their soul currently expresses, and a Deep Soul Blueprint of [Y] revealing their soul's underlying hunger and destiny. If X and Y differ, acknowledge the tension between them as a growth edge rather than a contradiction.

## Backward Compatibility

- Old readings in DB won't have `soulUrgeDeep` — UI falls back to showing only Active Soul Frequency
- No DB migration needed (JSONB field)

## Implementation Priority

1. Frontend first (immediate visible impact)
2. Backend sync second
3. Confirm both match before closing
