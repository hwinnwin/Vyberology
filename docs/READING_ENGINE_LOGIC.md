# Vybe Reading Engine (Volume IV)

## Pipeline Overview

1. **Capture Input** – raw strings from OCR, manual entry, or API calls feed into the V4 engine as `{ raw, context?, entryNo? }` payloads.
2. **Tokenization** – `extractTokens` normalises ordered tokens for time, percent, temperature, distance, fuel/consumption, codes, and counts. Each token stores raw text, numeric values, reduction digits, and optional buckets (e.g. `near_full`, `seventies`).
3. **Motif Detection** – `detectMotifs` inspects the token list (and optional context) for boolean motifs such as `mirror_time`, `gateway_11`, `arrival`, `shift_555`, `heart_6_stack`, etc. Motif priority influences salience ordering.
4. **Assembly** – `assembleReading` sorts tokens by motif strength → type priority, computes per-token reductions, derives the core frequency (digits summed to 1–9), and selects titles, themes, layered meaning rows, energy message, alignment summary, resonance, guidance, and essence sentences from `phrasebook.json`. Template selections are pure lookups keyed by motif + core.
5. **Delivery Blocks** – `renderVolumeIV` (legacy API) consumes the assembled blocks to build deterministic text/structured responses for clients while preserving explain-mode rationale.

## Token & Motif Examples

| Sample | Token Type | Notes |
|--------|------------|-------|
| `11:11` | time | Flags `mirror_time` + `gateway_11`; reduction → 4 |
| `15:51` | time | Flags `mirror_time`; reduction → 5 |
| `77 km` | distance | Flags `arrival` when paired with journey context or fuel readings |
| `11.1 L` | fuel | Flags `gateway_11`, `arrival`; reduction → 3 |
| `74%` | percent | Bucketed as `seventies` → layered message around balanced charge |
| `18°C` | temp | Reduction → 9; layered entry describes ambient alignment |

## Assembly Outputs

- **Header & Themes** – Resolved via `(dominant motif || default, core)` keys. Example: `15:51` (mirror) + core 5 → `Seal (The Mirror of Renewal)` with `Transition · Balance · Return to Self`.
- **Layered Meaning** – Up to four salient tokens mapped through type-specific tables (time, percent buckets, temperature, distance, codes, counts).
- **Energy & Resonance** – Motif/core pair determines energy message. Resonance prefers motif overrides (e.g. arrival → Air/ Earth with Crown + Root).
- **Alignment Summary** – Deduplicated focus rows chosen from reduced digits, master numbers, and raw numeric strings when present.
- **Explain Mode** – Optional payload capturing tokens, motifs, reduction steps, chosen template keys, and context for debugging.

## Quick Example

Input: `"77 km 11.1 L"` (arrival context)

1. Tokens → `distance(77 km)`, `fuel(11.1 L)` with reductions `5` and `3`.
2. Motifs → `arrival`, `gateway_11`, `mirror_time`, `triple`.
3. Core Frequency → `5 + 3 → 8`.
4. Title/Theme → `Seal (Home Frequency)` + `Arrival · Alignment · Spiritual Grounding`.
5. Resonance → Air 🜁 (clarity), Earth 🜃 (grounding); Chakras Crown 🤍 + Root ❤️.
6. Essence → “77 km · 11.1 L — wisdom grounded; you’ve arrived where peace and purpose meet.”

The same pipeline handles `11:11` (gateway alignment), `15:51` (mirror renewal), or composite captures (e.g. `06:16 99% 18°C 1200`) without branching logic—deterministic lookups ensure reproducible output.
