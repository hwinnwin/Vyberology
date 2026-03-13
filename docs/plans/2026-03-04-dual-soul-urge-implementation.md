# Dual Soul Urge Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a second Soul Urge calculation (Deep Soul Blueprint, Y-as-consonant) alongside the existing Active Soul Frequency (Y-as-vowel), displayed everywhere Soul Urge currently appears.

**Architecture:** Additive field `soulUrgeDeep: NumValue` added to `NumerologyNumbers` type. New `VOWELS_STRICT` set (no Y) + `soulUrgeDeepFromName()` calculator. All UI pages updated to show dual cards. Backend mirrored. Old readings without `soulUrgeDeep` gracefully fall back.

**Tech Stack:** TypeScript, React, Tailwind CSS, Vitest, Supabase Edge Functions (Deno)

---

### Task 1: Frontend — Add strict vowel set and deep Soul Urge calculator

**Files:**
- Modify: `apps/web/src/lib/numerology/letterMap.ts:32` (add VOWELS_STRICT)
- Modify: `apps/web/src/lib/numerology/calculators.ts:1-55` (add sumVowelsStrict, soulUrgeDeepFromName, update types and computeAll)

**Step 1: Add VOWELS_STRICT to letterMap.ts**

In `apps/web/src/lib/numerology/letterMap.ts`, after line 32 (`export const VOWELS = ...`), add:

```typescript
// Strict vowels (Y excluded) for Deep Soul Blueprint
export const VOWELS_STRICT = new Set(["A", "E", "I", "O", "U"]);
```

**Step 2: Update calculators.ts — imports, functions, types, computeAll**

In `apps/web/src/lib/numerology/calculators.ts`:

a) Update import on line 1 to also import `VOWELS_STRICT`:
```typescript
import { LETTER_MAP, VOWELS, VOWELS_STRICT, normalizeName } from "./letterMap";
```

b) After `sumConsonants` (line 13), add:
```typescript
export const sumVowelsStrict = (name: string) => lettersToSum(name, (ch) => VOWELS_STRICT.has(ch));
```

c) After `soulUrgeFromName` (line 31-32), add:
```typescript
export function soulUrgeDeepFromName(name: string): NumValue {
  return makeNumValue(sumVowelsStrict(name), true);
}
```

d) Update the `NumerologyNumbers` type (lines 40-46) to add `soulUrgeDeep`:
```typescript
export type NumerologyNumbers = {
  lifePath: NumValue;
  expression: NumValue;
  soulUrge: NumValue;
  soulUrgeDeep: NumValue;
  personality: NumValue;
  maturity: NumValue;
};
```

e) Update `computeAll` (lines 48-55) to include `soulUrgeDeep`:
```typescript
export function computeAll(fullName: string, dobISO: string): NumerologyNumbers {
  const lifePath = lifePathFromDOB(dobISO);
  const expression = expressionFromName(fullName);
  const soulUrge = soulUrgeFromName(fullName);
  const soulUrgeDeep = soulUrgeDeepFromName(fullName);
  const personality = personalityFromName(fullName);
  const maturity = maturityNumber(expression, lifePath);
  return { lifePath, expression, soulUrge, soulUrgeDeep, personality, maturity };
}
```

**Step 3: Type-check**

Run: `cd apps/web && npx tsc --noEmit 2>&1 | head -40`

Expected: Type errors in UI pages that destructure `NumerologyNumbers` (this is expected and will be fixed in later tasks). The calculator code itself should compile.

**Step 4: Commit**

```bash
git add apps/web/src/lib/numerology/letterMap.ts apps/web/src/lib/numerology/calculators.ts
git commit -m "feat(numerology): add VOWELS_STRICT set and soulUrgeDeep calculator"
```

---

### Task 2: Frontend — Add Deep Soul Blueprint descriptions

**Files:**
- Modify: `apps/web/src/lib/numerology/descriptions.ts:44` (add soulUrgeDeepDescriptions and helper)

**Step 1: Add soulUrgeDeepDescriptions**

In `apps/web/src/lib/numerology/descriptions.ts`, after line 44 (end of `soulUrgeDescriptions`), add:

```typescript
export const soulUrgeDeepDescriptions: Record<number, string> = {
  1: "Beneath everything, your soul hungers to originate — to be the first cause, the singular voice that breaks the silence.",
  2: "At your deepest level, you ache for true union — not just partnership, but the dissolution of separateness itself.",
  3: "Your soul's underlying hunger is to create something that outlives you — art, words, or joy that echoes beyond your years.",
  4: "Deep down, your soul demands permanence — something built so well it stands when everything else falls away.",
  5: "Your soul's root hunger is liberation — not adventure for its own sake, but the freedom to become whoever you're still becoming.",
  6: "At your core, you hunger to be needed — to be the one who holds the center when the world loses its balance.",
  7: "Your deepest hunger is knowing — not facts, but the kind of understanding that only comes from silence and solitude.",
  8: "Beneath the surface, your soul demands sovereignty — not just success, but the unshakable power to shape your own reality.",
  9: "Your soul's deepest hunger is release — to give everything away and discover what remains is the truest part of you.",
  11: "At your root, your soul hungers to channel something beyond itself — to be a vessel for insight the conscious mind cannot reach.",
  22: "Your deepest hunger is to leave infrastructure — systems, institutions, or legacies that reshape how others build their lives.",
  33: "At the deepest level, your soul hungers to transmute suffering into wisdom — to teach not through words but through presence itself.",
};
```

**Step 2: Add describeSoulUrgeDeep helper**

After the existing `describeSoulUrge` function (line 95-96), add:

```typescript
export function describeSoulUrgeDeep(n: number): string {
  return soulUrgeDeepDescriptions[n] || "A deeper hunger shaping your soul's destiny.";
}
```

**Step 3: Commit**

```bash
git add apps/web/src/lib/numerology/descriptions.ts
git commit -m "feat(numerology): add soulUrgeDeepDescriptions with deeper hunger framing"
```

---

### Task 3: Frontend — Write unit tests for dual Soul Urge calculation

**Files:**
- Create: `apps/web/src/lib/numerology/__tests__/dualSoulUrge.test.ts`

**Step 1: Write the tests**

Create the file `apps/web/src/lib/numerology/__tests__/dualSoulUrge.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sumVowels, sumVowelsStrict, soulUrgeFromName, soulUrgeDeepFromName, computeAll } from "../calculators";

describe("Dual Soul Urge", () => {
  // "Huynh Duc Tung Nguyen" — has Y in Huynh and Nguyen
  // Normalized: HUYNHDUCTUNGNGUYEN
  // Vowels (with Y): U(3) + Y(7) + U(3) + U(3) + U(3) + Y(7) + E(5) = 31 → 4
  // Vowels (strict): U(3) + U(3) + U(3) + U(3) + E(5) = 17 → 8

  it("sumVowels includes Y", () => {
    expect(sumVowels("Huynh Duc Tung Nguyen")).toBe(31);
  });

  it("sumVowelsStrict excludes Y", () => {
    expect(sumVowelsStrict("Huynh Duc Tung Nguyen")).toBe(17);
  });

  it("soulUrgeFromName returns Active Soul Frequency (Y = vowel)", () => {
    const result = soulUrgeFromName("Huynh Duc Tung Nguyen");
    expect(result).toEqual({ raw: 31, value: 4, isMaster: false });
  });

  it("soulUrgeDeepFromName returns Deep Soul Blueprint (Y = consonant)", () => {
    const result = soulUrgeDeepFromName("Huynh Duc Tung Nguyen");
    expect(result).toEqual({ raw: 17, value: 8, isMaster: false });
  });

  it("computeAll includes both soulUrge and soulUrgeDeep", () => {
    const result = computeAll("Huynh Duc Tung Nguyen", "1999-12-11");
    expect(result.soulUrge).toEqual({ raw: 31, value: 4, isMaster: false });
    expect(result.soulUrgeDeep).toEqual({ raw: 17, value: 8, isMaster: false });
  });

  // Name without Y — both should be identical
  it("name without Y produces unified soul frequencies", () => {
    const result = computeAll("Jane Doe", "1990-01-15");
    expect(result.soulUrge.value).toBe(result.soulUrgeDeep.value);
  });

  // Master number preservation in deep variant
  it("preserves master numbers in soulUrgeDeep", () => {
    // Need a name where strict vowels sum to a master number (11, 22, or 33)
    // "AEIOU" strict = A(1)+E(5)+I(9)+O(6)+U(3) = 24 → 6 (not master)
    // Try: vowels that sum to 11 → e.g. E(5)+O(6) = 11
    const result = soulUrgeDeepFromName("Bedro");
    // B=consonant, E=5, D=consonant, R=consonant, O=6 → strict vowels: 5+6 = 11
    expect(result).toEqual({ raw: 11, value: 11, isMaster: true });
  });
});
```

**Step 2: Run the tests**

Run: `cd apps/web && npx vitest run src/lib/numerology/__tests__/dualSoulUrge.test.ts`

Expected: All 6 tests PASS.

**Step 3: Commit**

```bash
git add apps/web/src/lib/numerology/__tests__/dualSoulUrge.test.ts
git commit -m "test(numerology): add dual Soul Urge unit tests"
```

---

### Task 4: Frontend — Update ReadingResult page

**Files:**
- Modify: `apps/web/src/pages/ReadingResult.tsx:112-178`

**Step 1: Update the numberCards array and add dual Soul Urge display**

In `apps/web/src/pages/ReadingResult.tsx`, replace the `numberCards` array (lines 112-118) with:

```typescript
  const soulUrgeDeep = numbers.soulUrgeDeep;
  const soulUrgeUnified = !soulUrgeDeep || numbers.soulUrge?.value === soulUrgeDeep?.value;

  const numberCards = [
    { label: "Life Path", key: "lifePath" },
    { label: "Expression", key: "expression" },
    { label: "Personality", key: "personality" },
    ...(tier === "full-vybe" ? [{ label: "Maturity", key: "maturity" }] : []),
  ];
```

Then replace the Number Cards `<section>` (lines 153-178) with:

```tsx
        {/* Number Cards */}
        <section className="max-w-[720px] mx-auto px-6 pb-8">
          <div className={`grid gap-3 ${numberCards.length <= 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
            {numberCards.map(({ label, key }) => {
              const num = numbers[key];
              if (!num) return null;
              return (
                <div
                  key={key}
                  className="relative text-center p-4 rounded-2xl border bg-white/50 backdrop-blur-sm"
                  style={{ borderColor: `${chakraColor}30` }}
                >
                  <span className="font-display text-3xl font-bold text-vy-charcoal">
                    {num.value}
                  </span>
                  {num.isMaster && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-vy-gold" title="Master Number" />
                  )}
                  <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-vy-charcoal/50 mt-1">
                    {label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Dual Soul Urge */}
          <div className="mt-4">
            {soulUrgeUnified ? (
              <div className="text-center p-5 rounded-2xl border bg-white/50 backdrop-blur-sm" style={{ borderColor: `${chakraColor}30` }}>
                <span className="font-display text-3xl font-bold text-vy-charcoal">
                  {numbers.soulUrge?.value}
                </span>
                {numbers.soulUrge?.isMaster && (
                  <span className="inline-block ml-2 w-2 h-2 rounded-full bg-vy-gold align-middle" title="Master Number" />
                )}
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-vy-charcoal/50 mt-1">
                  Soul Urge
                </p>
                <p className="font-sans text-[11px] text-vy-charcoal/40 mt-2 max-w-[360px] mx-auto">
                  Your soul frequencies are unified — no Y in your birth name.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative text-center p-4 rounded-2xl border bg-white/50 backdrop-blur-sm" style={{ borderColor: `${chakraColor}30` }}>
                    <span className="font-display text-3xl font-bold text-vy-charcoal">
                      {numbers.soulUrge?.value}
                    </span>
                    {numbers.soulUrge?.isMaster && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-vy-gold" title="Master Number" />
                    )}
                    <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-vy-charcoal/50 mt-1">
                      Active Soul Freq.
                    </p>
                  </div>
                  <div className="relative text-center p-4 rounded-2xl border bg-white/50 backdrop-blur-sm" style={{ borderColor: `${chakraColor}30` }}>
                    <span className="font-display text-3xl font-bold text-vy-charcoal">
                      {soulUrgeDeep.value}
                    </span>
                    {soulUrgeDeep.isMaster && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-vy-gold" title="Master Number" />
                    )}
                    <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-vy-charcoal/50 mt-1">
                      Deep Soul Blueprint
                    </p>
                  </div>
                </div>
                <p className="font-sans text-[11px] text-vy-charcoal/40 text-center mt-3 max-w-[480px] mx-auto leading-relaxed">
                  Your Active Soul Frequency reveals how your soul is currently expressing.
                  Your Deep Soul Blueprint reveals your soul's deeper hunger and destiny.
                </p>
              </>
            )}
          </div>
        </section>
```

**Step 2: Type-check**

Run: `cd apps/web && npx tsc --noEmit 2>&1 | head -20`

Expected: May still show errors in other files — ReadingResult itself should be clean.

**Step 3: Commit**

```bash
git add apps/web/src/pages/ReadingResult.tsx
git commit -m "feat(ui): dual Soul Urge display on ReadingResult page"
```

---

### Task 5: Frontend — Update SharedReading page

**Files:**
- Modify: `apps/web/src/pages/SharedReading.tsx:76-91`

**Step 1: Update the numbers grid**

In `apps/web/src/pages/SharedReading.tsx`, replace the numbers grid section (lines 76-91) with:

```tsx
      {/* Numbers grid */}
      <section className="max-w-[720px] mx-auto px-6 pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["lifePath", "expression", "personality"] as const).map((key) => {
            const num = numbers[key];
            if (!num) return null;
            const labels: Record<string, string> = { lifePath: "Life Path", expression: "Expression", personality: "Personality" };
            return (
              <div key={key} className="relative text-center p-4 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50">
                <span className="font-display text-3xl font-bold text-vy-charcoal">{num.value}</span>
                {num.isMaster && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-vy-gold" />}
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-vy-charcoal/50 mt-1">{labels[key]}</p>
              </div>
            );
          })}
        </div>

        {/* Dual Soul Urge */}
        {(() => {
          const su = numbers.soulUrge;
          const sud = numbers.soulUrgeDeep;
          const unified = !sud || su?.value === sud?.value;
          if (!su) return null;
          return (
            <div className="mt-4">
              {unified ? (
                <div className="text-center p-5 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50">
                  <span className="font-display text-3xl font-bold text-vy-charcoal">{su.value}</span>
                  {su.isMaster && <span className="inline-block ml-2 w-2 h-2 rounded-full bg-vy-gold align-middle" />}
                  <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-vy-charcoal/50 mt-1">Soul Urge</p>
                  <p className="font-sans text-[11px] text-vy-charcoal/40 mt-2">Your soul frequencies are unified — no Y in your birth name.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative text-center p-4 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50">
                      <span className="font-display text-3xl font-bold text-vy-charcoal">{su.value}</span>
                      {su.isMaster && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-vy-gold" />}
                      <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-vy-charcoal/50 mt-1">Active Soul Freq.</p>
                    </div>
                    <div className="relative text-center p-4 rounded-2xl border border-vy-charcoal/[0.08] bg-white/50">
                      <span className="font-display text-3xl font-bold text-vy-charcoal">{sud.value}</span>
                      {sud.isMaster && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-vy-gold" />}
                      <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-vy-charcoal/50 mt-1">Deep Soul Blueprint</p>
                    </div>
                  </div>
                  <p className="font-sans text-[11px] text-vy-charcoal/40 text-center mt-3 max-w-[480px] mx-auto leading-relaxed">
                    Your Active Soul Frequency reveals how your soul is currently expressing. Your Deep Soul Blueprint reveals your soul's deeper hunger and destiny.
                  </p>
                </>
              )}
            </div>
          );
        })()}
      </section>
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/SharedReading.tsx
git commit -m "feat(ui): dual Soul Urge display on SharedReading page"
```

---

### Task 6: Frontend — Update LyfPath and CareerOutlook pages

**Files:**
- Modify: `apps/web/src/pages/LyfPath.tsx`
- Modify: `apps/web/src/pages/CareerOutlook.tsx`

Both pages use the same pattern: an array of `{ label, num, desc }` objects mapped into a grid. We need to:
1. Import `soulUrgeDeepDescriptions`
2. Replace the single Soul Urge entry with dual entries
3. Add the unified/split logic

**Step 1: Update LyfPath.tsx**

In `apps/web/src/pages/LyfPath.tsx`:

a) Update the descriptions import to include `soulUrgeDeepDescriptions`:
```typescript
import {
  lifePathDescriptions,
  expressionDescriptions,
  soulUrgeDescriptions,
  soulUrgeDeepDescriptions,
  personalityDescriptions,
  maturityDescriptions,
} from "@/lib/numerology/descriptions";
```

b) Find the array that contains `{ label: "Soul Urge", num: freeResult.numbers.soulUrge, desc: soulUrgeDescriptions }` and replace the entire array with:

```typescript
{(() => {
  const su = freeResult.numbers.soulUrge;
  const sud = freeResult.numbers.soulUrgeDeep;
  const unified = su.value === sud.value;
  const baseCards = [
    { label: "Expression", num: freeResult.numbers.expression, desc: expressionDescriptions },
    { label: "Personality", num: freeResult.numbers.personality, desc: personalityDescriptions },
    { label: "Maturity", num: freeResult.numbers.maturity, desc: maturityDescriptions },
  ];
  const soulCards = unified
    ? [{ label: "Soul Urge", num: su, desc: soulUrgeDescriptions }]
    : [
        { label: "Active Soul Freq.", num: su, desc: soulUrgeDescriptions },
        { label: "Deep Soul Blueprint", num: sud, desc: soulUrgeDeepDescriptions },
      ];
  return [...soulCards, ...baseCards];
})().map(({ label, num, desc }) => (
```

**Step 2: Update CareerOutlook.tsx**

Apply the identical change to `apps/web/src/pages/CareerOutlook.tsx` — same import addition and same array replacement.

**Step 3: Update paid generation inputs in both files**

In both LyfPath.tsx and CareerOutlook.tsx, find the `inputs` array that includes:
```typescript
{ label: "Soul Urge Number", value: String(numbers.soulUrge.value) },
{ label: "Soul Urge Meaning", value: soulUrgeDescriptions[numbers.soulUrge.value] ?? "A deep inner calling." },
```

Replace with:
```typescript
{ label: "Active Soul Frequency", value: String(numbers.soulUrge.value) },
{ label: "Active Soul Meaning", value: soulUrgeDescriptions[numbers.soulUrge.value] ?? "A deep inner calling." },
{ label: "Deep Soul Blueprint", value: String(numbers.soulUrgeDeep.value) },
{ label: "Deep Soul Meaning", value: soulUrgeDeepDescriptions[numbers.soulUrgeDeep.value] ?? "A deeper hunger shaping your soul's destiny." },
```

Also add `soulUrgeDeepDescriptions` to the import in both files.

**Step 4: Commit**

```bash
git add apps/web/src/pages/LyfPath.tsx apps/web/src/pages/CareerOutlook.tsx
git commit -m "feat(ui): dual Soul Urge on LyfPath and CareerOutlook pages"
```

---

### Task 7: Frontend — Update RomanceOutlook page

**Files:**
- Modify: `apps/web/src/pages/RomanceOutlook.tsx`

This page is special — Soul Urge is the **hero display**. We need to show both prominently.

**Step 1: Update imports**

Add `soulUrgeDeepDescriptions` to the descriptions import.

**Step 2: Update the hero Soul Urge display**

Find the hero display section (around lines 288-305) that shows the big Soul Urge number. Replace it with a dual display:

```tsx
{/* Dual Soul Urge — hero display */}
{(() => {
  const su = freeResult.numbers.soulUrge;
  const sud = freeResult.numbers.soulUrgeDeep;
  const unified = su.value === sud.value;

  return (
    <div className="text-center mb-8">
      {unified ? (
        <>
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-2 mb-4" style={{ borderColor: elementColor }}>
            <span className="font-display text-5xl font-bold text-vy-charcoal">{su.value}</span>
          </div>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-vy-charcoal/40 mb-1">Soul Urge</p>
          <h2 className="font-display text-2xl font-semibold text-vy-charcoal mt-1">
            {romance?.archetype ?? `Soul Urge ${su.value}`}
          </h2>
          <p className="font-sans text-base leading-relaxed text-vy-charcoal/80 text-center max-w-[500px] mx-auto mt-4 mb-4">
            {soulUrgeDescriptions[su.value] ?? "A deep inner calling."}
          </p>
          <p className="font-sans text-[11px] text-vy-charcoal/40">Your soul frequencies are unified — no Y in your birth name.</p>
        </>
      ) : (
        <>
          <div className="flex justify-center gap-6 mb-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 mb-2" style={{ borderColor: elementColor }}>
                <span className="font-display text-4xl font-bold text-vy-charcoal">{su.value}</span>
              </div>
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.1em] text-vy-charcoal/40">Active Soul Freq.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 mb-2" style={{ borderColor: `${elementColor}80` }}>
                <span className="font-display text-4xl font-bold text-vy-charcoal">{sud.value}</span>
              </div>
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.1em] text-vy-charcoal/40">Deep Soul Blueprint</p>
            </div>
          </div>
          <h2 className="font-display text-2xl font-semibold text-vy-charcoal mt-1">
            {romance?.archetype ?? `Soul Urge ${su.value}`}
          </h2>
          <p className="font-sans text-sm leading-relaxed text-vy-charcoal/80 text-center max-w-[500px] mx-auto mt-4">
            {soulUrgeDescriptions[su.value] ?? "A deep inner calling."}
          </p>
          <p className="font-sans text-sm leading-relaxed text-vy-charcoal/60 text-center max-w-[500px] mx-auto mt-2 mb-4">
            {soulUrgeDeepDescriptions[sud.value] ?? "A deeper hunger shaping your soul's destiny."}
          </p>
          <p className="font-sans text-[11px] text-vy-charcoal/40 text-center max-w-[480px] mx-auto leading-relaxed">
            Your Active Soul Frequency reveals how your soul is currently expressing. Your Deep Soul Blueprint reveals your soul's deeper hunger and destiny.
          </p>
        </>
      )}
    </div>
  );
})()}
```

**Step 3: Update paid generation inputs**

Same pattern as Task 6 — replace the single Soul Urge input with dual inputs, adding `soulUrgeDeepDescriptions` import.

**Step 4: Commit**

```bash
git add apps/web/src/pages/RomanceOutlook.tsx
git commit -m "feat(ui): dual Soul Urge hero display on RomanceOutlook page"
```

---

### Task 8: Frontend — Update Compatibility page

**Files:**
- Modify: `apps/web/src/pages/Compatibility.tsx`

**Step 1: Update the synergy highlights**

Find the synergy highlight for Soul Urge (around line 274-277). Both `soulUrge` values in `leftNums`/`rightNums` arrays and the synergy display stay the same — the compatibility engine uses the Active Soul Frequency for blending (this is correct since compatibility is about how souls interact, not their deeper hunger).

No changes needed to the compatibility blending logic itself. Just update the paid generation inputs:

Find lines with `"Person A Soul Urge"` and `"Person B Soul Urge"` and add the deep variants:

```typescript
{ label: "Person A Active Soul Freq.", value: `${numbersA.soulUrge.value}${numbersA.soulUrge.isMaster ? " (Master)" : ""}` },
{ label: "Person A Deep Soul Blueprint", value: `${numbersA.soulUrgeDeep?.value ?? numbersA.soulUrge.value}${numbersA.soulUrgeDeep?.isMaster ? " (Master)" : ""}` },
// ...
{ label: "Person B Active Soul Freq.", value: `${numbersB.soulUrge.value}${numbersB.soulUrge.isMaster ? " (Master)" : ""}` },
{ label: "Person B Deep Soul Blueprint", value: `${numbersB.soulUrgeDeep?.value ?? numbersB.soulUrge.value}${numbersB.soulUrgeDeep?.isMaster ? " (Master)" : ""}` },
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/Compatibility.tsx
git commit -m "feat(ui): dual Soul Urge inputs for Compatibility paid generation"
```

---

### Task 9: Frontend — Update legacy components (ReadingCard, PairReadingCard)

**Files:**
- Modify: `apps/web/src/components/ReadingCard.tsx`
- Modify: `apps/web/src/components/PairReadingCard.tsx`

**Step 1: ReadingCard.tsx**

Find the Soul Urge card (around line 36-42) and add a second card for deep:

Replace the single Soul Urge card with:
```tsx
<div className="text-center p-4 rounded-lg bg-lf-midnight/50 border border-lf-violet/20 transition-all hover:border-lf-violet/50">
  <div className="text-3xl font-bold text-lf-aurora">{result.numbers.soulUrge.value}</div>
  <div className="text-xs text-lf-slate mt-1">{result.numbers.soulUrgeDeep && result.numbers.soulUrge.value !== result.numbers.soulUrgeDeep.value ? "Active Soul" : "Soul Urge"}</div>
  {result.numbers.soulUrge.isMaster && (
    <div className="text-xs font-semibold text-lf-violet mt-1">Master</div>
  )}
</div>
{result.numbers.soulUrgeDeep && result.numbers.soulUrge.value !== result.numbers.soulUrgeDeep.value && (
  <div className="text-center p-4 rounded-lg bg-lf-midnight/50 border border-lf-violet/20 transition-all hover:border-lf-violet/50">
    <div className="text-3xl font-bold text-lf-aurora">{result.numbers.soulUrgeDeep.value}</div>
    <div className="text-xs text-lf-slate mt-1">Deep Soul</div>
    {result.numbers.soulUrgeDeep.isMaster && (
      <div className="text-xs font-semibold text-lf-violet mt-1">Master</div>
    )}
  </div>
)}
```

**Step 2: PairReadingCard.tsx**

Add `soulUrgeDeep` display for both left and right, following the same pattern — show "Active Soul" / "Deep Soul" labels when they differ, "Soul" when unified.

**Step 3: Commit**

```bash
git add apps/web/src/components/ReadingCard.tsx apps/web/src/components/PairReadingCard.tsx
git commit -m "feat(ui): dual Soul Urge on legacy ReadingCard and PairReadingCard"
```

---

### Task 10: Frontend — Type-check and build

**Step 1: Type-check the entire frontend**

Run: `cd apps/web && npx tsc --noEmit 2>&1`

Expected: Zero errors. Fix any remaining type issues.

**Step 2: Run tests**

Run: `cd apps/web && npx vitest run`

Expected: All tests pass (including the new dual Soul Urge tests from Task 3).

**Step 3: Build**

Run: `cd apps/web && npm run build`

Expected: Successful build.

**Step 4: Commit if any fixes were needed**

```bash
git add -A && git commit -m "fix: resolve type errors from dual Soul Urge integration"
```

---

### Task 11: Backend — Mirror dual Soul Urge in Supabase edge function

**Files:**
- Modify: `supabase/functions/_shared/numerology.ts:9-15,81,109-152`

**Step 1: Add VOWELS_STRICT**

After `const VOWELS = ...` (line 81), add:
```typescript
const VOWELS_STRICT = new Set(["A", "E", "I", "O", "U"]);
```

**Step 2: Add soulUrgeDeepFromName**

After `soulUrgeFromName` (lines 133-135), add:
```typescript
export function soulUrgeDeepFromName(name: string): NumValue {
  return makeNumValue(lettersToSum(name, (ch) => VOWELS_STRICT.has(ch)), true);
}
```

**Step 3: Update NumerologyNumbers type**

Add `soulUrgeDeep: NumValue;` to the `NumerologyNumbers` type (lines 9-15):
```typescript
export type NumerologyNumbers = {
  lifePath: NumValue;
  expression: NumValue;
  soulUrge: NumValue;
  soulUrgeDeep: NumValue;
  personality: NumValue;
  maturity: NumValue;
};
```

**Step 4: Update computeAll**

Update `computeAll` (lines 145-152) to include `soulUrgeDeep`:
```typescript
export function computeAll(fullName: string, dobISO: string): NumerologyNumbers {
  const lifePath = lifePathFromDOB(dobISO);
  const expression = expressionFromName(fullName);
  const soulUrge = soulUrgeFromName(fullName);
  const soulUrgeDeep = soulUrgeDeepFromName(fullName);
  const personality = personalityFromName(fullName);
  const maturity = maturityNumber(expression, lifePath);
  return { lifePath, expression, soulUrge, soulUrgeDeep, personality, maturity };
}
```

**Step 5: Commit**

```bash
git add supabase/functions/_shared/numerology.ts
git commit -m "feat(backend): mirror dual Soul Urge in Supabase numerology engine"
```

---

### Task 12: Backend — Update vybe-reading AI prompt

**Files:**
- Modify: `supabase/functions/vybe-reading/index.ts`

**Step 1: Add dual Soul Urge framing to prompt templates**

Find the section in the LYF_PATH_TONE prompt where the Number Breakdown table is described. After the Soul Urge row instruction, add this framing context:

```
Note on Dual Soul Urge: This person has an Active Soul Frequency (Y counted as vowel) and a Deep Soul Blueprint (Y counted as consonant). The Active Soul Frequency reveals how their soul currently expresses. The Deep Soul Blueprint reveals their soul's underlying hunger and destiny. If the two values differ, acknowledge the tension between them as a growth edge rather than a contradiction.
```

Add the same note to the ROMANCE_GOLD_SHOT_TONE and CAREER_TONE prompts where Soul Urge is referenced.

**Step 2: Commit**

```bash
git add supabase/functions/vybe-reading/index.ts
git commit -m "feat(prompt): add dual Soul Urge framing to AI reading prompts"
```

---

### Task 13: Backend — Run backend tests and deploy

**Step 1: Run backend tests**

Run: `cd /Users/mrtungsten/Documents/Projects/archive/hwinnwin1199X/apps/vyberology && npx vitest run --config supabase/functions/vitest.config.ts --root supabase/functions`

Expected: All existing tests pass. The backend changes are additive so existing tests should still work.

**Step 2: Deploy edge functions**

Run: `npx supabase functions deploy vybe-reading --project-ref rcrwkarmlckyapqhdmxn`

**Step 3: Deploy frontend**

Run the standard build-and-deploy workflow:
```bash
cd apps/web && npm run build
rm -rf /private/tmp/vy-deploy && mkdir -p /private/tmp/vy-deploy
cp -R dist/* /private/tmp/vy-deploy/
cd /private/tmp && npx netlify deploy --prod --dir=vy-deploy --site=e6cd8e07-c209-464c-b7b5-26fe62538034
```

**Step 4: Commit any remaining fixes**

```bash
git add -A && git commit -m "chore: deploy dual Soul Urge to production"
```

---

### Task 14: Verification — End-to-end check

**Step 1: Visual verification with Playwright**

Navigate to vyberology.com and verify:
1. Create a free reading for a name WITH Y (e.g., "Huynh Duc Tung Nguyen") — should show dual cards
2. Create a free reading for a name WITHOUT Y (e.g., "Jane Doe") — should show unified card
3. Check RomanceOutlook, CareerOutlook, LyfPath pages all show dual display
4. Check an existing reading (from before the update) — should gracefully show only Active Soul Frequency

**Step 2: Confirm backend/frontend match**

For "Huynh Duc Tung Nguyen":
- Active Soul Frequency: raw 31, value 4
- Deep Soul Blueprint: raw 17, value 8

Both frontend and backend should produce these identical values.
