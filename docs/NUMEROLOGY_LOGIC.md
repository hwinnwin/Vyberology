# Numerology Logic Reference

This document captures the core numerology logic shared between the web and mobile Vyberology clients. It complements inline source comments and offers a compact reference for future enhancements.

## Core Number Calculation

- **Full-sum reduction:** All digits contained in the input string are summed repeatedly until a single digit remains.
- **Master number preservation:** Master 11 is never reduced to 2. Callers can override preservation by passing `settings: { preserveMaster11: false }`.
- **Fallbacks:** Inputs with no digits return `0` unless a fallback is provided. Literal values equal to a preserved master number return the literal without reduction.

## Element, Chakra, and Tone Mapping

Each supported core number (`1..9`, `11`) maps to a deterministic profile:

| Core | Element (glyph) | Chakra | Tone Label |
| ---: | --------------- | ------ | ---------- |
| 1 | Fire 🜂 | Root | Initiator Pulse |
| 2 | Water 🜄 | Sacral | Resonant Flow |
| 3 | Air 🜁 | Solar Plexus | Creative Current |
| 4 | Earth 🜃 | Heart | Foundation Grid |
| 5 | Air 🜁 | Throat | Messenger Wave |
| 6 | Earth 🜃 | Heart | Harmonic Steward |
| 7 | Water 🜄 | Third Eye | Mystic Signal |
| 8 | Earth 🜃 | Solar Plexus | Authority Forge |
| 9 | Fire 🜂 | Heart | Global Ember |
| 11 | Air 🜁 | Third Eye | Harmonic Bridge |

These mappings feed element stabilizers, chakra focus statements, and tone directives that later surface in message delivery blocks.

## Message Delivery v1

`renderVolumeIV` now supports structured delivery blocks while keeping the legacy concatenated text output for backwards compatibility.

- **Return shape:** Passing `{ format: "blocks" }` returns `{ text, blocks, rationale }` where `blocks` is:

  ```ts
  type ReadingBlocks = {
    header: string;
    elemental: string;
    chakra: string;
    resonance: string;
    essence: string;
    intention: string;
    reflection: string;
  };
  ```

- **Tone presets:** Supply `{ tone: "calm" | "direct" | "encouraging" }` to change phrasing without altering logic. Defaults to `calm`. Tone selection influences the header, essence, intention, reflection and resonance intro copy.

- **Conditional gates:** Optional content appears only when the underlying tokens are present:
  - Time tokens → `Time markers …`
  - Percent tokens → `Percent cues …`
  - Count tokens → `Count markers …`
  - Temperature tokens (confidence ≥ 0.6) → `Temperature cue …`
  - Digit anchors (from any token values) → `Anchors …`

- **Explain mode:** When `{ explain: true }` the rationale payload now records tone preset, tokens grouped by unit, and the exact blocks that were rendered.

- **Default text:** Whether or not `format: "blocks"` is supplied, the `text` field remains a double-newline join of the block values to preserve compatibility with pre-delivery consumers.

