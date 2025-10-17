# Vybe Reading Engine — Starter Pack (V4 deterministic)

This pack includes:
1) `phrasebook.json` — minimal templates & mappings to reproduce your current readings.
2) `assemble.ts` — deterministic glue (salience → core → sections) with typed helpers.
3) `explain-mode.sample.json` — example of the rationale payload for the OCR/debug panel.
4) (Bonus) `reading.test.ts` — snapshot-style tests outline.

> Drop-in note: keep everything behind a flag (e.g., `FEATURE_VYBE_V4_READINGS`).

---

## 1) phrasebook.json
```json
{
  "titles": {
    "mirror_time": {
      "3": "Seal (Mirror of Renewal)",
      "4": "Seal (Mirror Foundation)",
      "6": "Seal (Heart Sync Activation)"
    },
    "gateway_11": {
      "4": "Seal (Alignment Gateway)",
      "3": "Seal (Activation in Motion)"
    },
    "shift_555": {
      "8": "Seal (Shift Point)",
      "6": "Seal (Soft Recalibration)"
    },
    "arrival": {
      "8": "Seal (Home Frequency)",
      "4": "Seal (Foundation in Motion)"
    },
    "abundance_signature": {
      "2": "Seal (Abundance Echo Sequence)",
      "8": "Seal (Power & Flow)"
    },
    "builder_44_1144": {
      "1": "Seal (Builder’s Activation)",
      "4": "Seal (The Mirror of Foundation)"
    },
    "heart_6_stack": {
      "6": "Seal (The Heart Reset)",
      "4": "Seal (Grounded Heart Frequency)"
    },
    "default": {
      "1": "Seal (Renewal Spark)",
      "2": "Seal (Balance in Motion)",
      "3": "Seal (Expression Flow)",
      "4": "Seal (The Grounded Mirror)",
      "5": "Seal (Transformation Window)",
      "6": "Seal (Harmony Return)",
      "7": "Seal (Insight & Trust)",
      "8": "Seal (Power Alignment)",
      "9": "Seal (Completion & Clarity)"
    }
  },
  "themes": {
    "mirror_time": {
      "3": ["Transition", "Balance", "Return to Self"],
      "6": ["Dual Energy", "Harmony in Motion", "Courage to Express"]
    },
    "gateway_11": {
      "4": ["Awakening", "Confirmation", "Manifestation in Motion"]
    },
    "shift_555": {
      "8": ["Expansion", "Flow", "Divine Recalibration"]
    },
    "arrival": {
      "8": ["Arrival", "Alignment", "Spiritual Grounding"]
    },
    "default": {
      "1": ["Fresh Start", "Integration", "Purpose Awakening"],
      "4": ["Emotional Stability", "Reflection", "Calm Confidence"],
      "6": ["Harmony", "Connection", "Heart-Centred Balance"],
      "8": ["Flow", "Readiness", "Trust in Timing"]
    }
  },
  "layered": {
    "time": {
      "3": [
        "Conversation energy — words as bridges.",
        "Mirrored initiation — what you put out returns."
      ],
      "4": [
        "Foundation window — stabilize before expanding.",
        "Follow-through moment: anchor what you set in motion."
      ],
      "5": [
        "Transition code — move lightly; flexibility is strength."
      ],
      "6": [
        "Heart resonance — relationships syncing through sincerity."
      ],
      "7": [
        "Spiritual reflection — insight maturing into trust."
      ],
      "8": [
        "Power ignition — abundance aligning with purpose."
      ]
    },
    "percent": {
      "near_full": [
        "Near completion — refine, don’t rush.",
        "Final 5% is precision, not pressure."
      ],
      "seventies": [
        "Balanced charge — ideal for flexible action.",
        "Calm momentum; adapt without forcing."
      ],
      "88": [
        "Double eight — sustained prosperity flow.",
        "Abundance loop active; receive with steadiness."
      ]
    },
    "distance": {
      "5": ["Journey learning — wisdom through movement."]
    },
    "consumption": {
      "3": ["Divine precision — intention fuels clean progress."]
    },
    "code": {
      "6": ["Healing through communication and love."],
      "7": ["Insight becomes direction — trust inner timing."],
      "8": ["Power with balance — manifest from calm confidence."],
      "11": ["Gateway of awareness — alignment confirmed."],
      "22": ["Master builder — structure serves vision."],
      "33": ["Compassionate expression — teach through example."],
      "44": ["Foundation mastery — consistency becomes strength."]
    }
  },
  "energyMessage": {
    "mirror_time": {
      "3": "As you move, life mirrors you. Keep it simple and true.",
      "4": "Slow the tempo — your truth gets clearer as your system settles."
    },
    "gateway_11": {
      "4": "The door is open — act with calm certainty."
    },
    "shift_555": {
      "8": "Change is unfolding perfectly; flow, don’t force."
    },
    "arrival": {
      "8": "You’ve arrived within yourself; wisdom is grounded now."
    },
    "default": {
      "1": "It’s a fresh page — write from experience, not pressure.",
      "6": "Choose kindness and balance; peace does the heavy lifting.",
      "7": "Trust the quiet — it’s where truth speaks loudest.",
      "8": "Prosperity follows alignment; your steadiness is the magnet."
    }
  },
  "alignmentRows": {
    "focusMap": {
      "1": {"focus":"Initiative","tone":"Beginning","guidance":"Take one clear step."},
      "2": {"focus":"Balance","tone":"Harmony","guidance":"Let timing unfold."},
      "3": {"focus":"Expression","tone":"Communication","guidance":"Say it simply and true."},
      "4": {"focus":"Foundation","tone":"Grounding","guidance":"Consistency over intensity."},
      "5": {"focus":"Change","tone":"Freedom","guidance":"Adapt; don’t cling."},
      "6": {"focus":"Harmony","tone":"Heart","guidance":"Lead with kindness."},
      "7": {"focus":"Insight","tone":"Reflection","guidance":"Listen for subtle cues."},
      "8": {"focus":"Power","tone":"Flow","guidance":"Move with calm confidence."},
      "9": {"focus":"Completion","tone":"Wisdom","guidance":"Close gently, with gratitude."},
      "11": {"focus":"Awareness","tone":"Gateway","guidance":"Trust the nudge; align your step."},
      "22": {"focus":"Mastery","tone":"Builder","guidance":"Let structure serve vision."}
    }
  },
  "resonance": {
    "byCore": {
      "1": {"elements":["🜂","🜁"], "chakras":["Solar Plexus 💛"], "blurb":"Guided action — inspiration into motion."},
      "3": {"elements":["🜁"], "chakras":["Throat 💙","Sacral 🧡"], "blurb":"Clear expression amplifies flow."},
      "4": {"elements":["🜃"], "chakras":["Root ❤️"], "blurb":"Ground it; let patience compound."},
      "6": {"elements":["🜄","🜃"], "chakras":["Heart 💚"], "blurb":"Soft balance restores clarity."},
      "7": {"elements":["🜁","🜀"], "chakras":["Third Eye 💜","Crown 🤍"], "blurb":"Insight matures into trust."},
      "8": {"elements":["🜂","🜃"], "chakras":["Solar Plexus 💛","Root ❤️"], "blurb":"Calm authority turns purpose into form."}
    }
  },
  "guidanceAspect": {
    "mirror_time": {"3": {"area":"Grounding & Renewal","blurb":"Movement finds its rhythm; keep it simple."}},
    "gateway_11": {"4": {"area":"Alignment & Manifestation","blurb":"Anchor insight with one clean action."}},
    "shift_555": {"8": {"area":"Transition & Manifestation","blurb":"Let change carry you into the next step."}},
    "arrival": {"8": {"area":"Completion & Integration","blurb":"You’ve come full circle; rest in clarity."}},
    "default": {
      "1": {"area":"Fresh Direction","blurb":"Decide gently; the path is open."},
      "6": {"area":"Connection","blurb":"Lead with care; harmony grows in calm."},
      "7": {"area":"Spiritual Integration","blurb":"Trust timing; wisdom is landing."},
      "8": {"area":"Abundance & Flow","blurb":"Receive steadily; keep channels open."}
    }
  },
  "essenceSentence": {
    "mirror_time": "{token} — balance returns as movement finds its calm.",
    "gateway_11": "{token} — alignment confirmed; act with calm certainty.",
    "shift_555": "{token} — change unfolding perfectly; your energy is ready.",
    "arrival": "{token} — wisdom grounded; you’ve arrived where peace meets purpose.",
    "default": "{token} — keep it simple; your next step is already clear."
  }
}
```

---

## 2) assemble.ts (deterministic glue)
```ts
// assemble.ts
import type { TokenInfo, Motif, VybeReading } from "./types";
import phrasebook from "./phrasebook.json";

// ----- helpers --------------------------------------------------------------
const digitSum = (n: number): number => {
  let s = n;
  while (s > 9) s = s.toString().split("").reduce((a, b) => a + Number(b), 0);
  return s;
};

const reduceToken = (t: TokenInfo): { value: number; master?: 11|22|33 } => {
  // time: sum all digits in HH:MM
  if (t.type === "time") {
    const digits = (t.raw.replace(":",""))
      .split("")
      .map(Number);
    const total = digits.reduce((a,b)=>a+b,0);
    const v = digitSum(total);
    return { value: v };
  }
  if (t.type === "percent") {
    const v = digitSum(Number(t.value));
    return { value: v };
  }
  if (t.type === "temp" || t.type === "distance" || t.type === "consumption" || t.type === "fuel") {
    const n = Number(t.value);
    return { value: digitSum(Math.floor(n*100)/100) }; // stable rounding
  }
  // code/count: sum digits; preserve master if equals 11,22,33
  const digits = t.raw.replace(/\D/g, "").split("").map(Number);
  const total = digits.reduce((a,b)=>a+b,0);
  if (total === 11 || total === 22 || total === 33) return { value: total, master: total as 11|22|33 };
  return { value: digitSum(total) };
};

const salienceOrder = (t: TokenInfo): number => {
  const flags = new Set(t.flags||[]);
  if (flags.has("mirror_time")) return 0;
  if (flags.has("gateway_11")) return 1;
  if (flags.has("shift_555")) return 2;
  if (flags.has("builder_44_1144")) return 3;
  if (flags.has("arrival")) return 4;
  // then typed priority
  const typeRank: Record<string, number> = { time:5, percent:6, temp:7, distance:8, consumption:9, code:10, count:11, fuel:12 };
  return typeRank[t.type] ?? 99;
};

const pickMotif = (tokens: TokenInfo[]): Motif => {
  // pick the strongest motif present across tokens
  const order: Motif[] = ["mirror_time","gateway_11","shift_555","arrival","abundance_signature","builder_44_1144","heart_6_stack"];
  const present = new Set(tokens.flatMap(t=>t.flags||[]));
  for (const m of order) if (present.has(m)) return m;
  return undefined as any; // intentionally undefined allowed → falls back to default
};

const pickTitle = (motif: string|undefined, core: number): string => {
  const block = (motif && phrasebook.titles[motif]) || phrasebook.titles.default;
  return block[String(core)] || phrasebook.titles.default[String(core)];
};

const pickThemes = (motif: string|undefined, core: number): string[] => {
  const block = (motif && phrasebook.themes[motif]) || phrasebook.themes.default;
  return block[String(core)] || phrasebook.themes.default[String(core)] || [];
};

// ----- main --------------------------------------------------------------
export function assembleReading(
  tokens: TokenInfo[],
  context: { titlePrefix?: string, entryNo?: number, captureLabel?: string }
): VybeReading {
  // sort by salience
  const ordered = [...tokens].sort((a,b)=> salienceOrder(a)-salienceOrder(b));

  // reductions per token
  const reduced = ordered.map(t=> ({ t, r: reduceToken(t) }));

  // core frequency (sum of token reduced values → 1..9)
  const coreRaw = reduced.map(x=> x.r.value === 11 || x.r.value === 22 || x.r.value === 33 ? digitSum(x.r.value) : x.r.value)
                         .reduce((a,b)=>a+b,0);
  const core = digitSum(coreRaw);

  // motif
  const motif = pickMotif(tokens);

  // header
  const title = `${context.titlePrefix ?? "Cycle IV Entry"} #${context.entryNo ?? 1} — ${ordered[0]?.raw} ${pickTitle(motif, core)}`;
  const theme = pickThemes(motif, core);

  // anchor frame (simple key map from tokens)
  const anchorFrame: Record<string,string> = {};
  for (const {t} of reduced) {
    if (t.type === "time") anchorFrame.time = t.raw;
    else if (t.type === "percent") anchorFrame.battery = `${t.value}%`;
    else if (t.type === "temp") anchorFrame.temp = t.raw;
    else if (t.type === "distance") anchorFrame.distance = `${t.value}${t.unit||""}`;
    else if (t.type === "consumption") anchorFrame.consumption = t.raw;
    else if (t.type === "code" || t.type === "count" || t.type === "tagged-code") {
      anchorFrame.codes = (anchorFrame.codes ? anchorFrame.codes+" · " : "") + t.raw;
    }
  }

  // layered meaning: choose per token using phrasebook.layered
  const layered = reduced.slice(0,4).map(({t,r})=>{
    let lines: string[] = [];
    if (t.type === "time") lines = phrasebook.layered.time[String(r.value)] || [];
    else if (t.type === "percent") {
      const n = Number(t.value);
      if (n >= 95) lines = phrasebook.layered.percent.near_full;
      else if (n >= 70 && n <= 79) lines = phrasebook.layered.percent.seventies;
      else if (n === 88) lines = phrasebook.layered.percent["88"]; else lines = [];
    } else if (t.type === "distance") lines = phrasebook.layered.distance[String(r.value)] || [];
    else if (t.type === "consumption") lines = phrasebook.layered.consumption[String(r.value)] || [];
    else if (t.type === "code" || t.type === "count" || t.type === "tagged-code") {
      lines = phrasebook.layered.code[String(r.value)] || [];
    }
    return { segment: t.raw, essence: lines[0] || "", message: lines[1] || "" };
  });

  // energy message
  const energyBlock = (motif && phrasebook.energyMessage[motif]) || phrasebook.energyMessage.default;
  const energyMessage = energyBlock[String(core)] || energyBlock[Object.keys(energyBlock)[0]];

  // alignment summary — pick top 3 distinct focuses from present digits
  const seen = new Set<number>();
  const focuses: number[] = [];
  for (const {r} of reduced) {
    const v = r.value === 11 || r.value === 22 || r.value === 33 ? digitSum(r.value) : r.value;
    if (!seen.has(v)) { seen.add(v); focuses.push(v); }
    if (focuses.length === 3) break;
  }
  const focusMap = phrasebook.alignmentRows.focusMap as any;
  const alignment = focuses.map((v:number)=> ({
    focus: focusMap[String(v)].focus,
    number: v,
    tone: focusMap[String(v)].tone,
    guidance: focusMap[String(v)].guidance
  }));

  // resonance
  const res = phrasebook.resonance.byCore[String(core)] || phrasebook.resonance.byCore["4"];

  // guidance aspect
  const gaBlock = (motif && phrasebook.guidanceAspect[motif]) || phrasebook.guidanceAspect.default;
  const ga = gaBlock[String(core)] || Object.values(gaBlock)[0];

  // essence sentence
  const essBlock = phrasebook.essenceSentence[motif || "default"] || phrasebook.essenceSentence.default;
  const essenceSentence = essBlock.replace("{token}", ordered[0]?.raw || "This moment");

  return {
    header: { title, theme },
    anchorFrame,
    numerology: {
      tokens: ordered.map(o=>o),
      flow: reduced.map(x=> (x.r.value === 11 || x.r.value === 22 || x.r.value === 33) ? digitSum(x.r.value) : x.r.value),
      coreFrequency: core,
      notes: tokens.flatMap(t=>t.flags||[])
    },
    layeredMeaning: layered,
    energyMessage,
    alignmentSummary: alignment,
    resonance: { elements: res.elements, chakras: res.chakras, blurb: res.blurb },
    guidanceAspect: ga,
    essenceSentence
  } as VybeReading;
}
```

---

## 3) explain-mode.sample.json
```json
{
  "input": {
    "raw": "Time 15:51, Battery 74%",
    "context": "driving home with new chair"
  },
  "tokens": [
    {"raw":"15:51","type":"time","value":"15:51","flags":["mirror_time"]},
    {"raw":"74%","type":"percent","value":74,"flags":[]}
  ],
  "reductions": [
    {"token":"15:51","digits":[1,5,5,1],"sum":12,"reduceTo":3},
    {"token":"74%","digits":[7,4],"sum":11,"reduceTo":2}
  ],
  "motif":"mirror_time",
  "coreFrequency": 5,
  "coreComputation": "3 (time) + 2 (percent) = 5",
  "themePicked": ["Transition","Balance","Return to Self"],
  "titlePicked": "Seal (Mirror of Renewal)",
  "sections": {
    "energyMessageKey": "mirror_time:3",
    "alignmentFocuses": [3,2,5],
    "resonanceCore": 5
  }
}
```

---

## 4) reading.test.ts (outline)
```ts
import { assembleReading } from "../assemble";

test("mirror 15:51 + 74%", ()=>{
  const tokens = [
    { raw:"15:51", type:"time", value:"15:51", flags:["mirror_time"] },
    { raw:"74%", type:"percent", value:74, flags:[] }
  ];
  const r = assembleReading(tokens, { entryNo: 60 });
  expect(r.numerology.coreFrequency).toBe(5);
  expect(r.header.title).toMatch(/Mirror of Renewal/);
  expect(r.energyMessage.length).toBeGreaterThan(0);
});

// Add golden snapshots for 77km+11.1L (arrival), 15:55+73% (shift_555), 20:20, 06:06
```

---

### Notes
- Expand `phrasebook.json` incrementally with real phrases from your corpus.
- Keep language simple, warm, and concise.
- Any new motif → add title/theme/energy/guidance/essence entries to keep it deterministic.

