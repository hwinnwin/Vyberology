## **# Vyberology Multi-Target Implementation Plan**  
## **You are Codex. Follow this document step-by-step.**  
## **Do not change the project’s intent.**  
## **Implement exactly as described — Vite web + Expo mobile + shared logic package.**  
## **Each section includes commands, file paths, and code blocks to create.**  
## **Each section includes commands, file paths, and code blocks to create.**  
⸻  
##   
**0) Create the workspace (mono-repo)**  
  
```
# from your repo root
git checkout -b scaffold/multi-target
mkdir -p apps packages

# move your current Vite project into apps/web (rename folder accordingly)
# e.g. if current folder is this repo, do:
mkdir -p apps/web

```
shopt -s dotglob && mv !(apps|packages|node_modules) apps/web 2>/dev/null || true  
  
**Root package.json (workspaces)**  
  
**Create/replace at repo root:**  
  
```
{
  "name": "vybe-mono",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "engines": { "node": ">=18 <21" },
  "devDependencies": {
    "typescript": "^5.6.3",
    "turbo": "^2.1.3",
    "lint-staged": "^15.2.10",
    "prettier": "^3.3.3"
  },
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "test": "turbo test"
  }
}

```
  
****Optional ****turbo.json**** at root (fast runs):****  
  
```
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev": { "cache": false },
    "test": { "dependsOn": ["^build"] }
  }
}

```
  
****Root ****tsconfig.json****:****  
  
```
{
  "files": [],
  "references": [],
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true
  }
}

```
  
  
⸻  
##   
**1) Shared logic package: packages/reading-engine**  
  
```
mkdir -p packages/reading-engine/src

```
  
packages/reading-engine/package.json****:****  
  
```
{
  "name": "@vybe/reading-engine",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsc -w -p tsconfig.json",
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "vitest": "^2.1.2"
  }
}

```
  
packages/reading-engine/tsconfig.json****:****  
  
```
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "declaration": true,
    "emitDeclarationOnly": false
  },
  "include": ["src"]
}

```
  
packages/reading-engine/src/index.ts**** (starter skeleton):****  
  
```
export type NumberUnit = 'time'|'percent'|'temperature'|'count'|'plain';
export type NumberToken = { raw:string; values:number[]; unit:NumberUnit; confidence:number };

export type Signals = {
  coreNumber: number;                      // full-sum; preserve 11
  tokens: NumberToken[];                   // OCR outputs
  volume?: 'IV';
  toneHint?: string | null;
  settings?: { preserveMaster11?: boolean };
};

export function sumToCoreNumber(input: string): number {
  // TODO: implement modern full-sum; for now stub:
  // Keep master 11 (don't reduce); reduce others to 1..9
  const digits = (input.match(/\d/g) ?? []).map(d => +d).reduce((a,b)=>a+b,0);
  if (digits === 11) return 11;
  const reduce = (n: number): number => n > 9 ? reduce(n.toString().split('').map(Number).reduce((a,b)=>a+b)) : n;
  return reduce(digits);
}

const elementByCore: Record<number, {key:'fire'|'air'|'earth'|'water'; glyph:string; name:string}> = {
  1:{key:'fire', glyph:'🜂', name:'Fire'},
  2:{key:'water', glyph:'🜄', name:'Water'},
  3:{key:'air', glyph:'🜁', name:'Air'},
  4:{key:'earth', glyph:'🜃', name:'Earth'},
  5:{key:'air', glyph:'🜁', name:'Air'},
  6:{key:'earth', glyph:'🜃', name:'Earth'},
  7:{key:'water', glyph:'🜄', name:'Water'},
  8:{key:'earth', glyph:'🜃', name:'Earth'},
  9:{key:'fire', glyph:'🜂', name:'Fire'},
  11:{key:'air', glyph:'🜁', name:'Air'}
};

const chakraByCore: Record<number, {key:string; name:string; focus:string}> = {
  1:{key:'muladhara', name:'Root', focus:'stability + action'},
  2:{key:'svadhisthana', name:'Sacral', focus:'flow + desire'},
  3:{key:'manipura', name:'Solar Plexus', focus:'power + will'},
  4:{key:'anahata', name:'Heart', focus:'coherence + compassion'},
  5:{key:'vishuddha', name:'Throat', focus:'voice + truth'},
  6:{key:'ajna', name:'Third Eye', focus:'clarity + vision'},
  7:{key:'sahasrara', name:'Crown', focus:'source + unity'},
  8:{key:'manipura', name:'Solar Plexus', focus:'structure + mastery'},
  9:{key:'anahata', name:'Heart', focus:'universal service'},
  11:{key:'ajna', name:'Third Eye', focus:'intuitive leadership'}
};

export type RenderResult = { text: string; rationale?: any };

export function renderVolumeIV(signals: Signals, opts?: { explain?: boolean }): RenderResult {
  const core = signals.coreNumber;
  const element = elementByCore[core] ?? elementByCore[sumToCoreNumber(String(core))];
  const chakra = chakraByCore[core] ?? chakraByCore[sumToCoreNumber(String(core))];

  const hasTemp = signals.tokens.some(t => t.unit === 'temperature' && t.confidence >= 0.6);
  const anchors = Array.from(new Set(signals.tokens.flatMap(t => t.values)));

  const parts: string[] = [];
  parts.push(`Marker · Core ${core} · Tone: ${signals.toneHint ?? 'stabilized momentum'}`);
  parts.push(`Element: ${element.name} ${element.glyph}`);
  parts.push(`Chakra: ${chakra.name} — focus on ${chakra.focus}`);
  parts.push(`Chakra Resonance: ${chakra.name} in ${element.name} context${anchors.length ? ` · anchors ${anchors.join(', ')}` : ''}`);
  parts.push(`Essence: distilled guidance for core ${core}.`);
  parts.push(`Intention: align actions with ${chakra.focus}.`);
  parts.push(`Reflection: what confirms ${element.name} balance today?`);

  // Guardrail example: only mention temperature if present
  if (!hasTemp) {
    // ensure no accidental temp text is in the output — handled by template structure here
  }

  const rationale = opts?.explain ? {
    inputs: { core, tokens: signals.tokens },
    derivations: { element, chakra, anchors },
    render_decisions: [
      { section: 'header', because: 'core present' },
      { section: 'element', because: 'core→element map' },
      { section: 'chakra', because: 'core→chakra map' },
      { section: 'resonance', because: 'element+chakra present' },
      { omit: 'temperature mention', because: hasTemp ? 'present' : 'no °C/°F token' }
    ]
  } : undefined;

  return { text: parts.join('\n'), rationale };
}

```
  
## **You can refine mappings/text later — this gives you a deterministic backbone now.**  
  
⸻  
##   
**2) Web app (apps/web): Tesseract OCR + debug + poor-man’s Sentry**  
  
**From repo root:**  
  
```
cd apps/web
npm i tesseract.js

```
  
## **Create flags:**  
##   
```
apps/web/src/lib/flags.ts

```
  
```
export const FEAT_OCR = import.meta.env.VITE_FEATURE_OCR === 'on';

```
export const FEAT_PM_SENTRY = import.meta.env.VITE_FEATURE_PM_SENTRY === 'on';  
  
****Env (create ****.env.local**** in apps/web):****  
  
```
VITE_FEATURE_OCR=on
VITE_FEATURE_PM_SENTRY=on
VITE_SUPABASE_URL=<<your supabase url>>
VITE_SUPABASE_ANON_KEY=<<your anon key>>

```
  
**Error table (run once in Supabase SQL):**  
  
```
create table if not exists public.error_log (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  url text,
  message text not null,
  stack text,
  user_agent text,
  user_id uuid,
  context jsonb
);
alter table public.error_log enable row level security;
create policy "anon can insert error_log" on public.error_log for insert to anon with check (true);
create policy "auth can insert error_log" on public.error_log for insert to authenticated with check (true);
-- (optional) lock reads in prod:

```
create policy "no selects from client" on public.error_log for select to authenticated using (false);  
  
## **Reporter:**  
##   
```
apps/web/src/lib/errorReporter.ts

```
  
```
export async function reportError(err: unknown, ctx: Record<string,unknown> = {}) {
  try {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    const payload = {
      message, stack,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      context: ctx
    };
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/error_log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY!}`,
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.warn('[reportError] failed', e);
  }
}

```
  
****Hook it (e.g., in ****apps/web/src/main.tsx****):****  
  
```
import { FEAT_PM_SENTRY } from './lib/flags';
import { reportError } from './lib/errorReporter';

if (FEAT_PM_SENTRY) {
  window.addEventListener('error', e => reportError(e.error, { type: 'onerror' }));
  window.addEventListener('unhandledrejection', e => reportError(e.reason, { type: 'unhandledrejection' }));
}

```
  
## **Web OCR:**  
##   
```
apps/web/src/ocr/extractNumbersWeb.ts

```
  
```
import Tesseract from 'tesseract.js';
import type { NumberToken, NumberUnit } from '@vybe/reading-engine';

const TIME = /\b(?:(?:[01]?\d|2[0-3]):[0-5]\d(?:\s?(?:AM|PM|am|pm))?)\b/;
const TEMP = /\b-?\d{1,3}\s?(?:°\s?)?(?:C|F|°C|°F)\b/;
const PERCENT = /\b\d{1,3}(?:[.,]\d{1,2})?\s?%\b/;
const COUNT = /\b\d{1,3}(?:[.,]\d{3})+\b/;
const PLAIN = /\b\d{1,4}\b/;

export async function recognizeText(src: string | File | Blob) {
  const worker = await Tesseract.createWorker({
    tessedit_char_whitelist: '0123456789:%°CFcf .:-APMapm'
  } as any);
  const { data } = await worker.recognize(src as any);
  await worker.terminate();
  return { text: data.text ?? '', confidence: (data.confidence ?? 0) / 100 };
}

export function parseTokens(text: string, baseConf=0.7): NumberToken[] {
  const tokens: NumberToken[] = [];
  const push = (raw:string, unit:NumberUnit, values:number[]) => tokens.push({ raw, unit, values, confidence: baseConf });

  for (const m of text.matchAll(TIME)) { const [h,min]=m[0].replace(/\s?(AM|PM|am|pm)$/,'').split(':').map(n=>+n); push(m[0],'time',[h,min]); }
  for (const m of text.matchAll(TEMP)) { const n=parseInt(m[0].replace(/[^\d-]/g,''),10); push(m[0],'temperature',[n]); }
  for (const m of text.matchAll(PERCENT)) { const n=parseFloat(m[0].replace('%','').replace(',','.')); push(m[0],'percent',[n]); }
  for (const m of text.matchAll(COUNT)) { const n=parseInt(m[0].replace(/[.,]/g,''),10); push(m[0],'count',[n]); }
  if (!TIME.test(text) && !TEMP.test(text) && !PERCENT.test(text) && !COUNT.test(text)) {
    for (const m of text.matchAll(PLAIN)) { const v=parseInt(m[0],10); if (!Number.isNaN(v)) push(m[0],'plain',[v]); }
  }

  return tokens.filter((t,i,a)=>a.findIndex(x=>x.raw===t.raw && x.unit===t.unit)===i)
               .sort((a,b)=> b.confidence - a.confidence);
}

```
  
## **Dev OCR screen:**  
##   
```
apps/web/src/dev/OcrDebug.tsx

```
  
```
import React, { useState } from 'react';
import { recognizeText, parseTokens } from '../ocr/extractNumbersWeb';
import { FEAT_OCR } from '../lib/flags';
import { renderVolumeIV } from '@vybe/reading-engine';

export default function OcrDebug() {
  const [img, setImg] = useState<string>('');
  const [reading, setReading] = useState<string>('');
  const [raw, setRaw] = useState<string>('');

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setImg(URL.createObjectURL(file));
    const { text, confidence } = await recognizeText(file);
    setRaw(text);
    const tokens = parseTokens(text, confidence);
    const out = renderVolumeIV({ coreNumber: 11, tokens, volume:'IV' }, { explain: true });
    setReading(out.text + '\n\n---\nExplain:\n' + JSON.stringify(out.rationale, null, 2));
  }

  if (!FEAT_OCR) return <div>OCR disabled.</div>;
  return (
    <div style={{padding:16}}>
      <input type="file" accept="image/*" onChange={onPick}/>
      {img && <img src={img} style={{maxWidth:420,display:'block',marginTop:12}}/>}
      <h4>Raw OCR</h4>
      <pre style={{whiteSpace:'pre-wrap',background:'#111',color:'#ddd',padding:12}}>{raw}</pre>
      <h4>Reading + Rationale</h4>
      <pre style={{whiteSpace:'pre-wrap',background:'#111',color:'#ddd',padding:12}}>{reading}</pre>
    </div>
  );
}

```
  
## **Wire a dev route in your router (e.g., **/dev/ocr**) and guard it to **import.meta.env.DEV**.**  
  
⸻  
##   
**3) Mobile app (apps/mobile): Expo + ML Kit (on-device)**  
  
```
cd ../../apps
npx create-expo-app mobile
cd mobile
npm i @react-native-ml-kit/text-recognition expo-image-picker
npx expo prebuild

```
  
## **Add an OCR screen:**  
##   
apps/mobile/app/ocr-debug.tsx**** (Expo Router) or ****screens/OcrDebug.tsx**** if not using Router:****  
  
```
import { useState } from 'react';
import { View, Text, Image, Button, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { renderVolumeIV, type NumberToken } from '@vybe/reading-engine';

export default function OcrDebug() {
  const [uri, setUri] = useState<string | null>(null);
  const [out, setOut] = useState<string>('');

  async function pick() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!res.canceled) {
      const u = res.assets[0].uri;
      setUri(u);
      const result = await TextRecognition.recognize(u);
      const text = result.text ?? '';
      const tokens: NumberToken[] = parseTokensNative(result, 0.85);
      const reading = renderVolumeIV({ coreNumber: 11, tokens, volume: 'IV' }, { explain: true });
      setOut(reading.text + '\n\n---\nExplain:\n' + JSON.stringify(reading.rationale, null, 2));
    }
  }

  function parseTokensNative(res: any, baseConf: number): NumberToken[] {
    const text = res.text ?? '';
    // reuse same regex parsing as web; confidence heuristic fixed at baseConf
    const TIME=/\b(?:(?:[01]?\d|2[0-3]):[0-5]\d(?:\s?(?:AM|PM|am|pm))?)\b/;
    const TEMP=/\b-?\d{1,3}\s?(?:°\s?)?(?:C|F|°C|°F)\b/;
    const PERCENT=/\b\d{1,3}(?:[.,]\d{1,2})?\s?%\b/;
    const COUNT=/\b\d{1,3}(?:[.,]\d{3})+\b/;
    const PLAIN=/\b\d{1,4}\b/;
    const tokens: NumberToken[] = [];
    const push=(raw:string,unit:any,values:number[])=>tokens.push({raw,unit,values,confidence:baseConf});
    for (const m of text.matchAll(TIME)) { const [h,min]=m[0].replace(/\s?(AM|PM|am|pm)$/,'').split(':').map(n=>+n); push(m[0],'time',[h,min]); }
    for (const m of text.matchAll(TEMP)) { const n=parseInt(m[0].replace(/[^\d-]/g,''),10); push(m[0],'temperature',[n]); }
    for (const m of text.matchAll(PERCENT)) { const n=parseFloat(m[0].replace('%','').replace(',','.')); push(m[0],'percent',[n]); }
    for (const m of text.matchAll(COUNT)) { const n=parseInt(m[0].replace(/[.,]/g,''),10); push(m[0],'count',[n]); }
    if (!TIME.test(text) && !TEMP.test(text) && !PERCENT.test(text) && !COUNT.test(text)) {
      for (const m of text.matchAll(PLAIN)) { const v=parseInt(m[0],10); if (!Number.isNaN(v)) push(m[0],'plain',[v]); }
    }
    return tokens.filter((t,i,a)=>a.findIndex(x=>x.raw===t.raw && x.unit===t.unit)===i);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Button title="Pick Image" onPress={pick} />
      {uri && <Image source={{ uri }} style={{ width: '100%', height: 260, resizeMode: 'contain' }} />}
      <Text selectable style={{ fontFamily: 'Courier', marginTop: 12 }}>{out}</Text>
    </ScrollView>
  );
}

```
  
**Run:**  
  
```
npm run android
# or
npm run ios

```
  
## **(Expo will guide simulator/device. For iOS camera fidelity, test a real device when you can.)**  
  
⸻  
##   
**4) History + Rationale storage (Supabase)**  
  
**Add tables (shared for both clients):**  
  
```
create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  volume text not null default 'IV',
  core_number int not null,
  raw_extracted jsonb not null,
  computed jsonb not null,
  rendered text not null,
  created_at timestamptz not null default now()
);

alter table public.readings enable row level security;
create policy "owner select" on public.readings for select using (auth.uid() = user_id);
create policy "owner insert" on public.readings for insert with check (auth.uid() = user_id);
create policy "owner update" on public.readings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

```
create index if not exists idx_readings_user_time on public.readings(user_id, created_at desc);  
  
**Client save (web/mobile the same idea):**  
  
```
async function saveReading(supabaseUrl: string, anonKey: string, payload: {
  user_id: string|null,
  volume: string,
  core_number: number,
  raw_extracted: unknown,
  computed: unknown,
  rendered: string
}) {
  await fetch(`${supabaseUrl}/rest/v1/readings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Prefer: 'return=representation'
    },
    body: JSON.stringify(payload)
  });
}

```
  
## **Call it after **renderVolumeIV** with **{inputs, derivations}** as **raw_extracted**/**computed** (your “explain mode” output).**  
  
⸻  
##   
**5) What to ask Codex to do for you (copy this prompt)**  
##   
**Task:** Implement @vybe/reading-engine details and wire OCR + history.  
	1.	In packages/reading-engine, complete sumToCoreNumber (modern full-sum; preserve 11), refine element/chakra/tone mappings, and add unit tests with Vitest.  
	2.	In apps/web, mount /dev/ocr route showing OcrDebug, and add a button that saves the reading to Supabase using the provided saveReading.  
	3.	In apps/mobile, add an “OCR Debug” screen to the tab stack, ensure expo-image-picker permission flow works, and show the rendered reading + rationale.  
	4.	Add feature flags: VITE_FEATURE_OCR, VITE_FEATURE_PM_SENTRY. Honor them.  
	5.	Ensure renderer **never** mentions temperature unless a temperature token exists (confidence ≥ 0.6). Add a unit test for this gate.  
  
⸻  
##   
**6) Rollout order (safe)**  
	1.	**Build shared package**:  
  
```
npm install
npm run build --workspaces

```
  
##   
	2.	**Run web** and test /dev/ocr with a screenshot:  
  
```
cd apps/web && npm run dev

```
  
##   
	3.	**Run mobile** (Android first for easiest device test):  
  
```
cd ../mobile && npm run android

```
  
##   
	4.	**Flip flags off** if anything misbehaves — instant rollback.  
  
⸻  
##   
## **If you hit any error during these steps, paste the first ~20 lines of the error and I’ll pinpoint the fix.**  
