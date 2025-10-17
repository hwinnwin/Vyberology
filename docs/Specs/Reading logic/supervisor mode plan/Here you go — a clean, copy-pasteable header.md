Here you go — a clean, copy-pasteable header:  
  
⸻  
  
**SUPERVISOR MODE: PLAN → EXECUTE → VERIFY**  
  
**Intent:**  
Implement the deterministic “Vyberology: Volume IV” reading engine exactly as specified. No generative copy. All output must be reconstructable from tokens, reductions, motifs, and templates.  
  
⸻  
  
**PLAN**  
	1.	**Scope & Guardrails**  
	•	Keep API stable; no breaking changes.  
	•	Gate with FEATURE_VYBE_V4_READINGS.  
	•	Gate with FEATURE_VYBE_V4_READINGS.  
	•	Externalize all copy in phrasebook.json (no inline strings).  
	•	Externalize all copy in phrasebook.json (no inline strings).  
	2.	**Modules**  
	•	types.ts: canonical types/enums.  
	•	parse.ts: regex tokenizers (time, %, temp, distance, consumption, fuel, count, code, tagged-code).  
	•	parse.ts: regex tokenizers (time, %, temp, distance, consumption, fuel, count, code, tagged-code).  
	•	motifs.ts: boolean motif detectors (mirror, progression, triple, 11-gateway, arrival, near-full, abundance, 44/1144, heart-6, 555).  
	•	assemble.ts: salience → reductions → core → template selection → sections.  
	•	assemble.ts: salience → reductions → core → template selection → sections.  
	•	phrasebook.json: titles, themes, layered meanings, energy messages, alignment rows, resonance, guidance aspect, essence sentence.  
	•	phrasebook.json: titles, themes, layered meanings, energy messages, alignment rows, resonance, guidance aspect, essence sentence.  
	•	explain-mode: rationale payload for OCR/debug.  
	•	explain-mode: rationale payload for OCR/debug.  
	3.	**Test Plan**  
	3.	**Test Plan**  
	•	Unit tests for parsing, reductions, motif detection, and assembly.  
	•	Snapshot tests for 5 golden cases (mirror, progression, percent, arrival, 555).  
	•	Coverage target ≥ **98%**.  
	•	Coverage target ≥ **98%**.  
  
⸻  
  
**EXECUTE**  
	1.	**Parsing**  
	•	Extract tokens in capture order; normalize values.  
	•	Tag early motifs (e.g., mirror_time for 15:51, gateway_11 for 11.1).  
	•	Tag early motifs (e.g., mirror_time for 15:51, gateway_11 for 11.1).  
	2.	**Reduction**  
	2.	**Reduction**  
	•	Digit-sum per token; preserve masters (11/22/33) at token level.  
	•	Time reduction: sum HHMM digits.  
	•	Percent buckets: near-full (≥95), seventies (70–79), special 88.  
	3.	**Salience & Core**  
	3.	**Salience & Core**  
	•	Sort tokens by motif strength then type priority.  
	•	Core = sum of token reductions (masters reduced for core), digit-summed to 1–9.  
	4.	**Assembly**  
	•	Title & theme: (motif, core) lookup.  
	•	Title & theme: (motif, core) lookup.  
	•	Anchor frame: map token types → labeled fields.  
	•	Layered meaning: per-token (type×digit/bucket) table.  
	•	Energy message/guidance/resonance/essence: strict template lookups.  
	•	Explain-mode: include tokens, steps, motif set, chosen templates, core math.  
	5.	**Flags & Docs**  
	5.	**Flags & Docs**  
	•	Wrap new flow with FEATURE_VYBE_V4_READINGS.  
	•	Update docs/NUMEROLOGY_LOGIC.md with rules and examples.  
  
⸻  
  
**VERIFY**  
	1.	**Automated**  
	•	npm run test --workspace @vybe/reading-engine  
	•	npm run test --workspace @vybe/reading-engine  
	•	Report coverage summary (≥98%).  
	•	Snapshot diffs must be zero.  
	2.	**Golden Samples (print JSON excerpts)**  
	•	15:51 + 74% → mirror, core=5, title includes “Mirror”.  
	•	11:11 → gateway, core=4, title includes “Alignment Gateway”.  
	•	15:55 + 73% → shift_555, core=8, energy message = change/flow.  
	•	77 km + 11.1 L (arrival) → arrival motif, core=8, resonance Root+Crown.  
	•	06:06 → heart_6_stack, core=3, title includes “Heart Reset”.  
	3.	**Manual Checklist**  
	•	No inline prose; all strings from phrasebook.json.  
	•	Deterministic outputs given identical inputs.  
	•	Explain-mode payload present and accurate.  
	•	Feature flag off → legacy behavior intact.  
	4.	**Acceptance Criteria**  
	•	All tests pass; coverage ≥98%.  
	•	Outputs for provided examples match approved snapshots exactly.  
	•	No API breaks; performance unaffected.  
	5.	**Rollback**  
	5.	**Rollback**  
	•	Toggle FEATURE_VYBE_V4_READINGS off to revert.  
	•	Keep legacy path untouched.  
  
**DONE** when: tests + coverage + snapshots green, explain-mode verified, docs updated, and feature-flagged build ready for integration.  
**DONE** when: tests + coverage + snapshots green, explain-mode verified, docs updated, and feature-flagged build ready for integration.  
