# Five-Number Oracle Documentation

**Version**: 1.0
**Status**: Production Ready
**Platform**: Vyberology

---

## Overview

The **Five-Number Oracle** is an interactive micro-format for live and asynchronous divination readings. Users capture or select 5 numbers (1-99), each with a specific meaning. The system analyzes the pattern across all 5 numbers and synthesizes a unified guidance message with actionable steps.

### Key Features
- **60-180 second reading format** (optimized for social content)
- **Interactive co-creation** (audience participation via comments/polls)
- **Pattern synthesis** (9 harmonic pattern types)
- **Element + Chakra mapping** (full VYBE integration)
- **Monetization-ready** (free → premium tiers)
- **Social content templates** (Stories, Reels, TikTok, Live)

---

## Architecture

### Tech Stack

**Backend**:
- **Database**: PostgreSQL (Supabase)
  - `oracle_readings` table with RLS policies
  - Pattern analytics views
  - Streak tracking functions
- **API**: Supabase Edge Functions (Deno)
  - `/oracle-reading` endpoint
  - Streaming support for real-time delivery
  - Rate limiting + auth integration
- **Engine**: `@vybe/reading-engine` (TypeScript package)
  - 1-99 meaning bank with VYBE language
  - Pattern detection algorithms
  - Synthesis logic

**Frontend**:
- **Framework**: React + TypeScript
- **Route**: `/oracle`
- **Components**: Interactive number capture interface
  - 5-slot visual board
  - Time capture integration
  - Manual number entry
  - Pattern display with markdown

**Deployment**:
- Web: `vyberology.com/oracle`
- Mobile: Capacitor-ready (iOS/Android)

---

## Core Concepts

### The Five Numbers

Each number (1-99) represents a specific energy, action, and resonance:

**Root Archetypes (1-9)**:
- **1**: Start / Spark / Declare → Fire, Root
- **2**: Partner / Choose harmony → Water, Sacral
- **3**: Express / Ship draft one → Air, Solar Plexus
- **4**: Structure / Set the rule → Earth, Root
- **5**: Pivot / Test new path → Air, Throat
- **6**: Nurture / Protect asset → Earth, Heart
- **7**: Reflect / Data over drama → Water, Third Eye
- **8**: Power / Price properly → Earth, Solar Plexus
- **9**: Complete / Release backlog → Fire, Crown

**Master Numbers** (11, 22, 33, 44):
- **11**: Signal / Trust the antenna → Air, Third Eye
- **22**: Foundation++ / Build platform → Earth, Crown
- **33**: Amplify / Teach what you do → Air, Throat
- **44**: Architect / Design the engine → Earth, Root

**Compound Numbers** (10-99):
- Built from root archetypes + contextual modifiers
- Full bank available in `packages/reading-engine/src/oracle/meaningBank.ts`

### Pattern Types

The oracle detects 9 harmonic patterns across the 5 numbers:

1. **Build** 🏗️: Foundation → Action (e.g., 4→11→8→5→22)
2. **Release** 🌊: Completion → Freedom (e.g., 9→7→5→3→1)
3. **Amplify** 📣: Signal → Expression (e.g., 11→33→3→8→14)
4. **Balanced** ⚖️: Even distribution across elements/chakras
5. **Focused** 🎯: Strong concentration in one energy
6. **Transition** 🦋: Clear before/after shift
7. **Ascending** 🚀: Rising momentum
8. **Descending** 🏔️: Releasing momentum
9. **Cyclical** 🔄: Return to origin

**Pattern Strength**: 0.0-1.0 coherence score based on:
- Element alignment (30%)
- Chakra alignment (30%)
- Diversity balance (40%)

### Synthesis Logic

**Step 1: Individual Meanings**
- Each of the 5 numbers gets its one-line meaning + action cue

**Step 2: Pattern Detection**
- Analyze element distribution
- Analyze chakra distribution
- Check for signature sequences (build/release/amplify)
- Detect momentum direction (ascending/descending)

**Step 3: Unified Message**
- Dominant element + chakra
- Pattern-specific synthesis template
- 2-3 sentence coherent guidance
- 5-step action sequence
- Essence sentence (closing power statement)

---

## API Reference

### Endpoint: `/oracle-reading`

**Method**: `POST`

**Headers**:
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

**Request Body**:
```json
{
  "numbers": [4, 11, 8, 5, 22],
  "captureTimestamps": ["2025-11-13T10:30:00Z", ...],
  "captureMethods": ["time", "manual", "time", "manual", "time"],
  "sessionId": "optional-session-id",
  "sessionType": "instant",
  "tier": "free",
  "saveToHistory": true
}
```

**Response**:
```json
{
  "success": true,
  "reading": {
    "numbers": [4, 11, 8, 5, 22],
    "coreFrequencies": [4, 11, 8, 5, 22],
    "meanings": [
      {
        "number": 4,
        "meaning": "Structure / Set the rule",
        "action": "Build foundation",
        "element": "Earth",
        "chakra": "Root",
        "keywords": ["stability", "discipline", "order", "foundation"]
      },
      // ... 4 more
    ],
    "pattern": {
      "type": "build",
      "description": "Foundation → Action: Building something to last",
      "strength": 0.85,
      "dominantElement": "Earth",
      "dominantChakra": "Root",
      "synthesis": "This is a Builder sequence: Anchor → Signal → Monetize → Test → Systemize. This pull leans 🜃 Earth, ❤️ Root energy—stability, discipline, order, foundation. Take one foundational action today, then systemize the win.",
      "actionSequence": [
        "Build foundation",
        "Follow intuition",
        "Own your value",
        "Experiment freely",
        "Systemize the win"
      ]
    },
    "title": "Your Builder Oracle",
    "synthesis": "This is a Builder sequence...",
    "essenceSentence": "Build foundation, integrate, then systemize the win.",
    "cta": "Comment BUILDER for your foundation guide",
    "markdown": "# 🏗️ Your Builder Oracle\n\n..."
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Exactly 5 numbers are required"
  }
}
```

**Rate Limits**:
- Free tier: 30 requests/minute
- Authenticated: 60 requests/minute

---

## Database Schema

### `oracle_readings` Table

```sql
CREATE TABLE oracle_readings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),

  -- The Five Numbers
  numbers INTEGER[5] NOT NULL,
  capture_timestamps TIMESTAMPTZ[5],
  capture_methods TEXT[5],

  -- Analysis
  core_frequencies INTEGER[5] NOT NULL,
  dominant_frequency INTEGER NOT NULL,
  harmonic_pattern TEXT NOT NULL,
  pattern_strength NUMERIC(3,2),

  -- Reading data (JSONB)
  reading_data JSONB NOT NULL,

  -- Session metadata
  session_id TEXT,
  session_type TEXT,

  -- Engagement
  shared BOOLEAN DEFAULT false,
  saved BOOLEAN DEFAULT true,
  feedback_rating INTEGER,

  -- Privacy
  data_consent_given BOOLEAN DEFAULT false,
  anonymized BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Monetization
  reading_tier TEXT DEFAULT 'free',
  price_aud NUMERIC(10,2)
);
```

**Indexes**:
- `idx_oracle_readings_user_id` on `user_id`
- `idx_oracle_readings_pattern` on `harmonic_pattern`
- `idx_oracle_readings_numbers` (GIN) on `numbers`

**Functions**:
- `get_user_oracle_patterns(user_id, limit)` → pattern frequency
- `get_user_oracle_numbers(user_id, limit)` → number frequency
- `get_user_oracle_streak(user_id)` → current/longest streak + total

**Views**:
- `oracle_pattern_analytics` → anonymized aggregated stats

---

## Frontend Usage

### Import and Use

```tsx
import Oracle from "@/pages/Oracle";

// Route is /oracle
<Route path="/oracle" element={<Oracle />} />
```

### Component Flow

**1. Number Capture**:
- Display 5 slots (1-5)
- Current slot highlighted
- Capture methods:
  - **Time**: Extract from current clock (e.g., 11:11 → 1111 % 99 + 1)
  - **Manual**: User types number 1-99
  - **Pattern**: Select from saved patterns (future)

**2. Validation**:
- All 5 slots filled
- Numbers in valid range (1-99)
- No duplicates warning (optional)

**3. Generation**:
- Call `/oracle-reading` API
- Show loading state (sparkles animation)
- Handle errors gracefully

**4. Display Reading**:
- Pattern emoji + title
- 5 numbers with meanings (visual grid)
- Individual interpretations (border-left design)
- Synthesis box (highlighted)
- Action sequence (numbered list)
- Essence sentence (gradient box)
- CTA button (pattern-specific)

**5. Actions**:
- **Share**: Native share or clipboard
- **Reset**: Clear and start over
- **Save**: Store to history (authenticated)

---

## Social Content Integration

### Story Format (7 slides)

**Template Location**: `docs/oracle-story-templates.md`

**Slide Breakdown**:
1. Hook (pick 5 numbers)
2. Number grid
3-7. Individual meanings
8. Pattern synthesis
9. CTA + link

**Design Assets**:
- Canva templates available
- Pattern-specific color schemes
- Element/chakra symbol overlays

### Live Format (90-180s)

**Run-of-Show**:
1. Setup (10s): Explain format
2. Collect (30-60s): Watch chat, lock 5 repeats
3. Interpret (40-80s): One-line meanings
4. Synthesize (15-30s): Pattern + guidance
5. CTA (5-10s): Comment keyword for guide

**Interactive Mechanics**:
- Repeat-lock system (only repeated numbers count)
- Keyword auto-DM (e.g., "BUILDER" → foundation guide PDF)
- Streak tracking (shout-out top participants)

### Reel/TikTok Format (60s)

**Script Template**:
```
[0-5s] "Drop a number 1-99. First five that repeat = today's message."
[5-15s] Watch chat, lock numbers on screen
[15-45s] Rapid-fire meanings (6s each)
[45-55s] Pattern synthesis
[55-60s] CTA: "Comment GATE for cheat sheet"
```

---

## Monetization Strategy

### Tier Structure (AUD)

**Free**:
- Unlimited basic oracle readings
- Individual number meanings
- Pattern type identification
- Action sequence

**Basic ($19-49 AUD)**:
- Personalized Five (DM form + 2-min audio)
- Pattern deep-dive analysis
- Custom action plan
- Element/chakra guidance

**Premium ($99-149 AUD)**:
- Live mini-session (15 min)
- Strategy notes document
- Recorded session
- Follow-up Q&A

**Team ($249+ AUD)**:
- Team/brand oracle pull
- Rollout plan (content + ops actions)
- Group alignment session
- 30-day support

### Revenue Projections (30-Day)

**Conservative**:
- 10 Basic × $29 = $290
- 3 Premium × $119 = $357
- 1 Team × $299 = $299
- **Total**: $946 AUD

**Moderate**:
- 25 Basic × $29 = $725
- 8 Premium × $119 = $952
- 3 Team × $349 = $1,047
- **Total**: $2,724 AUD

**Optimistic**:
- 50 Basic × $39 = $1,950
- 15 Premium × $149 = $2,235
- 5 Team × $399 = $1,995
- **Total**: $6,180 AUD

### Conversion Funnels

**Free → Basic**:
- CTA in free reading: "Want deeper analysis?"
- Email sequence (3 emails over 7 days)
- Limited-time discount (first 20 buyers)

**Basic → Premium**:
- Upsell at booking: "+$90 for live session"
- Post-reading email: "Book your strategy call"
- Testimonial social proof

**Premium → Team**:
- Ask during session: "Leading a team?"
- Enterprise pitch deck (PDF)
- Case study showcase

---

## Engagement Mechanics

### Repeat-Lock System
**How It Works**:
- Only numbers that appear 2+ times in comments count
- Drives participation ("Someone said 11 already!")
- Creates community investment

**Implementation**:
- Track comment counts in real-time
- Visual indicator when number locks
- Shout-out first person who triggers lock

### Keyword Auto-DM
**Setup** (Instagram/TikTok automation):
- "ORACLE" → Decoder PDF (all 99 meanings)
- "BUILDER" → Builder pattern guide
- "GATE" → Full reading link
- "[PATTERN_NAME]" → Pattern-specific PDF

**Tools**:
- ManyChat (Instagram)
- TikTok Creator Tools
- Custom webhook integration

### Streak Tracking
**Mechanics**:
- Daily oracle = +1 to streak
- Miss a day = reset to 0
- Milestones: 7-day, 30-day, 90-day badges

**Rewards**:
- Weekly shout-outs (top 5 streakers)
- Exclusive pattern reveals (30+ day)
- Free premium upgrade (90+ day)

---

## Analytics & Optimization

### Key Metrics

**Engagement**:
- Oracle submissions (count/day)
- Completion rate (5/5 numbers captured)
- Pattern distribution (which patterns most common)
- Share rate (per pattern)
- Comment-to-conversion rate

**Content Performance**:
- Retention on 60s Reels (target >25%)
- Story swipe-through rate (target >40%)
- Link clicks from CTA (target >10%)

**Monetization**:
- Free → Basic conversion rate (target 2%)
- Basic → Premium upsell rate (target 15%)
- Average order value (target $75 AUD)
- Lifetime value per user (target $150 AUD)

### A/B Tests to Run

**Week 1-2**:
- [ ] Hook variations (3 versions)
- [ ] CTA language ("Comment" vs "Drop" vs "Type")
- [ ] Pattern emoji sets (realistic vs abstract)

**Week 3-4**:
- [ ] Story slide count (7 vs 5 vs 10)
- [ ] Number entry method (time vs manual)
- [ ] Pricing tiers ($29 vs $39 for Basic)

**Week 5-6**:
- [ ] Synthesis length (2 sentences vs 4)
- [ ] Visual styles (minimalist vs maximalist)
- [ ] Auto-DM timing (instant vs 5-min delay)

---

## Technical Implementation Guide

### Setup Checklist

**Backend** (Supabase):
- [x] Run migration: `20251113000000_create_oracle_readings_table.sql`
- [ ] Deploy Edge Function: `oracle-reading`
- [ ] Test API endpoint with Postman/curl
- [ ] Configure rate limits
- [ ] Set up error logging

**Frontend** (React):
- [x] Add `/oracle` route to `App.tsx`
- [x] Create `Oracle.tsx` page component
- [ ] Test number capture flow
- [ ] Test API integration
- [ ] Test reading display
- [ ] Add to navigation menu

**Package** (reading-engine):
- [x] Build oracle module (`src/oracle/`)
- [ ] Run tests: `npm run test`
- [ ] Build package: `npm run build`
- [ ] Verify exports in consuming apps

**Content**:
- [ ] Create 7-slide story templates (Canva)
- [ ] Write decoder PDF (99 meanings)
- [ ] Film sample Reels (3 patterns)
- [ ] Set up keyword auto-responders

### Testing Procedures

**Unit Tests**:
```bash
cd packages/reading-engine
npm run test
```

**Integration Tests**:
1. Generate oracle reading via API
2. Verify pattern detection
3. Check database insertion
4. Validate RLS policies

**E2E Tests**:
1. Navigate to `/oracle`
2. Capture 5 numbers (time + manual mix)
3. Generate reading
4. Verify display formatting
5. Test share functionality
6. Test reset flow

**Load Tests**:
- Simulate 100 concurrent requests
- Target: <500ms p95 response time
- Check rate limiting behavior

---

## Troubleshooting

### Common Issues

**"Exactly 5 numbers are required"**:
- Check request body format
- Verify numbers array length
- Ensure no null values

**"Rate limit exceeded"**:
- Wait 60 seconds
- Use authenticated requests (higher limit)
- Implement exponential backoff

**Pattern strength always 0.0**:
- Check element/chakra mapping in meaning bank
- Verify pattern detection logic
- Inspect coherence calculation

**Reading not saving to database**:
- Check `saveToHistory` flag
- Verify user authentication
- Inspect RLS policies
- Check database logs

---

## Roadmap

### Phase 1: MVP (✅ Complete)
- [x] Meaning bank (1-99)
- [x] Pattern synthesis (9 types)
- [x] API endpoint
- [x] Frontend UI
- [x] Database schema
- [x] Story templates

### Phase 2: Enhancement (In Progress)
- [ ] Advanced pattern detection (transitional states)
- [ ] Image-based number capture (OCR)
- [ ] Voice number entry ("Hey Lumen, capture 11")
- [ ] Pattern evolution tracking
- [ ] Community oracle (weekly collective)

### Phase 3: Scale (Future)
- [ ] Mobile app (iOS/Android)
- [ ] Paid tier checkout flow
- [ ] Creator toolkit (embed oracle on your site)
- [ ] API for third-party integrations
- [ ] Oracle marketplace (custom meaning banks)

### Phase 4: Advanced (Vision)
- [ ] AI-powered synthesis (GPT-4 enhancement)
- [ ] Video oracle readings (automated generation)
- [ ] Multi-language support
- [ ] Real-time collaborative oracles
- [ ] Oracle DAO (community governance)

---

## Support & Community

**Documentation**:
- Main docs: `/docs/five-number-oracle.md`
- Story templates: `/docs/oracle-story-templates.md`
- API reference: This file (section above)

**Code Locations**:
- Backend: `apps/web/supabase/functions/oracle-reading/`
- Frontend: `apps/web/src/pages/Oracle.tsx`
- Engine: `packages/reading-engine/src/oracle/`
- Database: `apps/web/supabase/migrations/20251113000000_*`

**Support Channels**:
- GitHub Issues: Bug reports + feature requests
- Discord: Community discussion + Q&A
- Email: support@vyberology.com

---

## Credits

**Concept**: Five-Number Oracle micro-format
**Implementation**: Claude Code (v1.0)
**Platform**: Vyberology
**License**: Proprietary (Internal use)

---

**Last Updated**: 2025-11-13
**Document Version**: 1.0.0
