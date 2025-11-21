# Vyberology Redevelopment (Lumen Prime)

**Status**: Phase 2 Complete ✅
**Architecture**: Modular, API-first, deterministic
**Volumes**: I (Core Engine), II (Composer), V (Integration - planned), VI (Transmission - planned)

---

## 🎯 Project Overview

Vyberology is being redeveloped as a clean, modular reading system with:
- **Volume I**: Deterministic numerology parser (extract → calculate → map)
- **Volume II**: Narrative composition engine (templates → structured output)
- **Volume V**: Integration layer (history, notes, tags, export, analytics) - *coming next*
- **Volume VI**: Transmission layer (API keys, webhooks, partner ecosystem) - *planned*

**North Star**: Frequency-as-form → measurable, reproducible outcomes.

---

## 📁 Monorepo Structure

```
vyberology/
├── packages/
│   ├── types/              # Zod schemas + TypeScript types
│   ├── core/               # Volume I: Numerology engine
│   ├── composer/           # Volume II: Narrative templates
│   └── sdk-js/             # Typed API client
├── apps/
│   ├── api/                # Fastify REST API + OpenAPI
│   └── web/                # Next.js UI (existing)
├── infra/
│   ├── db/                 # Supabase SQL + seed script
│   └── docker/             # Docker Compose (planned)
└── tests/
    └── e2e/                # Playwright tests (planned)
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 9.15.4
- Supabase account (for database)

### Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Build all packages
pnpm -r build

# 3. Set up environment
cp apps/api/.env.example apps/api/.env
# Edit .env with your Supabase credentials

# 4. Start API server
pnpm --filter @vyberology/api dev
# Server runs at http://localhost:3000
# API docs at http://localhost:3000/docs

# 5. (Optional) Seed demo data
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_KEY=your-service-key
pnpm tsx infra/db/seed.ts
```

---

## 📦 Package Details

### `@vyberology/types`

Shared Zod schemas and TypeScript types for the entire system.

**Key exports**:
- `ReadingInput` - Input for reading generation
- `ReadingDataV1` - Volume I engine output
- `ComposedReadingV2` - Volume II composed reading
- All schemas include `.parse()` validation

### `@vyberology/core`

**Volume I Engine** - Deterministic numerology parser.

**Pipeline**:
1. `extractNumbers(text)` → Extract number tokens
2. `fullSum(values)` → Calculate numerology (preserves 11/22/33)
3. `mapElements(data, context)` → Assign Fire/Air/Earth/Water
4. `mapChakras(data, context)` → Map to energy centers
5. `buildEngine(input)` → Complete ReadingDataV1 with trace

**Test coverage**: 90%+ (68 tests passing)

**Example**:
```typescript
import { buildEngine } from '@vyberology/core';

const engine = buildEngine({
  sourceType: 'text',
  rawText: '10:24 • 67% • 144 likes',
  metadata: { context: 'Instagram screenshot' }
});

console.log(engine.sums.reduced); // 3
console.log(engine.elements); // ['🜁 Air', '🜃 Earth']
console.log(engine.chakras); // ['Solar Plexus']
```

### `@vyberology/composer`

**Volume II Composer** - Narrative generation from engine data.

**Templates**:
- `generateMarkerTitle(engine)` - "Marker 3 – Stabilized Momentum"
- `generateCoreEquationTone(engine)` - "Expression × Structure = Embodied Expansion"
- `generateEssence(engine)` - Core essence statement
- `generateIntention(engine)` - Actionable intention
- `generateReflectionKey(engine)` - Reflection question
- `generateChakraResonance(engine)` - Chakra analysis paragraph

**Main function**:
```typescript
import { composeReading } from '@vyberology/composer';

const composed = composeReading(engine);
console.log(composed.markerTitle);
console.log(composed.essence);
console.log(composed.reflectionKey);
```

### `@vyberology/sdk`

Typed client for consuming the Vyberology API.

```typescript
import { createClient } from '@vyberology/sdk';

const client = createClient({
  baseUrl: 'http://localhost:3000',
  apiKey: 'optional-api-key'
});

// Generate complete reading
const { engine, composed } = await client.read({
  sourceType: 'text',
  rawText: '11:11',
  metadata: { context: 'Mirror time' }
});

// Or use separate steps
const engine = await client.parse(input);
const composed = await client.compose(engine);
```

---

## 🔌 API Endpoints

### Core Reading Endpoints

**POST /v1/parse**
- Input: `ReadingInput`
- Output: `ReadingDataV1`
- Extracts numbers and generates Volume I engine data

**POST /v1/compose**
- Input: `{ data: ReadingDataV1 }`
- Output: `ComposedReadingV2`
- Generates narrative from engine data

**POST /v1/read**
- Input: `ReadingInput`
- Output: `{ engine: ReadingDataV1, composed: ComposedReadingV2 }`
- Convenience endpoint (parse + compose)

### System Endpoints

**GET /health**
- Health check with uptime

**GET /docs**
- Interactive OpenAPI documentation (Swagger UI)

---

## 🗄️ Database Schema

### Tables

**`readings`**
- Stores complete readings (input + engine + composed)
- Row Level Security: users can only access their own readings
- Indexed on `user_id`, `created_at`, `volume`

**`api_keys`** (Volume VI)
- Partner API key management
- Scopes, rate limits, expiration

### Seed Data

Three demo readings included:
1. Instagram screenshot (10:24 • 67% • 144 likes) → Marker 3
2. Mirror time (11:11) → Marker 4 with Crown activation
3. Master number 33 (6 9 9 9) → Universal Teacher

**Run seed**:
```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_KEY=your-service-key
pnpm tsx infra/db/seed.ts
```

**Demo credentials**:
- Email: `demo@vyberology.local`
- Password: `demo123`

---

## 🧪 Testing

```bash
# Run all tests
pnpm -r test

# Run with coverage
pnpm --filter @vyberology/core test:coverage

# Watch mode
pnpm --filter @vyberology/core test:watch
```

**Current coverage**:
- `@vyberology/core`: 90%+ (68 tests)
- Edge cases: master numbers, decimals, empty input, context keywords

---

## 🎨 Design Principles

### 1. Strict Modularity
- Core engine ≠ UI ≠ storage
- Each package has single responsibility
- Clear boundaries between volumes

### 2. Deterministic First
- All transformations are reproducible
- No randomness in core/composer
- Full audit trail in `trace` object

### 3. Typed & Tested
- Zod schemas for runtime validation
- TypeScript for compile-time safety
- 90%+ test coverage target

### 4. Cost Conscious
- Lean dependencies
- No LLM calls in core flow (optional in future)
- Efficient queries with proper indexing

---

## 📊 Volume Architecture

### Volume I: Core Engine (Deterministic Layer)
**Purpose**: Parse inputs → extract numbers → apply numerology → map to elements/chakras
**Outputs**: Pure data (JSON), traceable, reproducible
**Location**: `packages/core`

### Volume II: Embodiment Composer (Narrative Layer)
**Purpose**: Take engine data → compose human-readable reading blocks
**Outputs**: Structured text (marker, essence, intention, reflection)
**Location**: `packages/composer`

### Volume V: Integration (Data Flow & UX - Phase 3)
**Purpose**: History, notes, tags, export, analytics
**Outputs**: Timelines, CSV/JSON exports, dashboards
**Status**: Planned (next phase)

### Volume VI: Transmission (Ecosystem Interfaces - Phase 4)
**Purpose**: Public API, webhooks, partner keys, rate limiting
**Outputs**: API keys, signed webhooks, partner sandbox
**Status**: Planned

---

## 🔮 Example End-to-End Flow

```typescript
import { buildEngine } from '@vyberology/core';
import { composeReading } from '@vyberology/composer';

// 1. User input
const input = {
  sourceType: 'text' as const,
  rawText: '10:24 • 67% • 144 likes',
  metadata: {
    context: 'Instagram screenshot',
    timestamp: '2025-11-21T10:24:00Z'
  }
};

// 2. Volume I: Parse & calculate
const engine = buildEngine(input);
// {
//   tokens: [{ value: 10, raw: '10', index: 0 }, ...],
//   sums: { fullSum: 30, reduced: 3 },
//   elements: ['🜁 Air', '🜃 Earth'],
//   chakras: ['Solar Plexus'],
//   phase: { volume: 1 },
//   trace: { ... }
// }

// 3. Volume II: Compose narrative
const composed = composeReading(engine);
// {
//   markerTitle: 'Marker 3 – Stabilized Momentum',
//   coreEquationTone: 'Expression × Structure = Embodied Expansion',
//   essence: 'Creative power flows through you...',
//   intention: 'Claim your will. Direct your energy with confidence.',
//   reflectionKey: 'How can you express your truth more fully?',
//   chakraResonance: 'Your Solar Plexus ignites...',
//   meta: { engine, version: '2.0.0' }
// }

// 4. (Optional) Save to database
// await supabase.from('readings').insert({ user_id, input, engine, composed })
```

---

## 🚧 Roadmap

### ✅ Phase 1: Foundation (COMPLETE)
- [x] Monorepo structure
- [x] TypeScript + Zod types
- [x] Volume I engine (core)
- [x] Volume II composer
- [x] Unit tests (90%+ coverage)

### ✅ Phase 2: API & Infrastructure (COMPLETE)
- [x] Fastify REST API
- [x] OpenAPI/Swagger documentation
- [x] Supabase schema + RLS
- [x] Seed script with demo data
- [x] SDK client

### 🔄 Phase 3: Volume V (Integration) - NEXT
- [ ] History with filters (search, elements, chakras, tags)
- [ ] Notes & journaling
- [ ] Tag system (many-to-many)
- [ ] Export (CSV/JSON with background worker)
- [ ] Analytics (elements/chakras over time)
- [ ] UI screens (history, insights, export)

### 📋 Phase 4: Volume VI (Transmission)
- [ ] API key management
- [ ] Rate limiting per key
- [ ] Signed webhooks
- [ ] Partner sandbox environment
- [ ] LumenFlow/LumenOrca bridges

### 📋 Phase 5: Polish & Deploy
- [ ] E2E tests (Playwright)
- [ ] Docker Compose for local dev
- [ ] CI/CD pipeline
- [ ] Production deployment
- [ ] Documentation site

---

## 🔧 Configuration

### Environment Variables

**API Server** (`apps/api/.env`):
```bash
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
CORS_ORIGIN=*

# Database (for Volume 5+)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

---

## 📚 Resources

- **API Documentation**: http://localhost:3000/docs (when running)
- **OpenAPI Spec**: `apps/api/openapi.yaml`
- **Database Schema**: `infra/db/schema.sql`
- **Demo Data**: `infra/demo-readings.json`
- **GitHub**: [hwinnwin/Vyberology](https://github.com/hwinnwin/Vyberology)

---

## 🤝 Contributing

This is a redevelopment branch. Key principles:

1. **Small PRs**: Each feature/fix in its own commit
2. **Green tests**: All tests must pass before merge
3. **No TODO debt**: Finish or remove TODO comments
4. **Typed everything**: Use Zod for runtime + TS for compile-time
5. **Document as you go**: Update this README with major changes

---

## 📝 Notes

### Why the Redevelopment?

The existing Vyberology system (Volume IV) is powerful but tightly coupled. This redevelopment:
- Separates concerns (engine vs. composition vs. UI)
- Makes the system testable and maintainable
- Enables API-first architecture for integrations
- Provides clear upgrade path to Volumes V & VI

### Relationship to Existing System

This lives **alongside** the current Volume IV implementation in:
- `/packages/reading-core-private/` (existing)
- `/apps/web/` (existing React app)

Once Phases 3-4 are complete, we can migrate the web app to use the new API.

---

## 🎯 Success Metrics

**Phase 2 (Current)**:
- ✅ All packages build successfully
- ✅ 90%+ test coverage on core
- ✅ OpenAPI documentation complete
- ✅ Seed script creates demo data
- ✅ API accepts requests and returns valid readings

**Phase 3 (Next)**:
- [ ] History endpoint with 5+ filters
- [ ] Export generates valid CSV/JSON
- [ ] Analytics endpoints return time-series data
- [ ] UI displays history with working filters

---

**Built with 🔮 by Lumen Prime**
*Frequency-as-form → measurable, reproducible outcomes*
