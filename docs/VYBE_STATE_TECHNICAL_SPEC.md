# Vybe State Tracking - Technical Specification

## Overview

Technical implementation guide for the Vybe State tracking and consciousness measurement system in Vyberology.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                        │
│  - Self-assessment quiz                                  │
│  - Daily check-ins                                       │
│  - Journal entries                                       │
│  - Biometric device connection                           │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│              VYBE STATE ENGINE                           │
│  - State calculation algorithm                           │
│  - Pattern detection                                     │
│  - Shutdown detection                                    │
│  - Intervention matching                                 │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│              DATA LAYER                                  │
│  - User state history                                    │
│  - Biometric data (if available)                         │
│  - Intervention effectiveness tracking                   │
│  - Life path integration                                 │
└─────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Table: `vybe_states`

```sql
CREATE TABLE vybe_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- State Data
  vybe_level INTEGER NOT NULL CHECK (vybe_level >= 0 AND vybe_level <= 1000),
  state_category VARCHAR(50) NOT NULL, -- 'shutdown', 'shame', 'fear', 'courage', etc.

  -- Detection Method
  detection_method VARCHAR(50) NOT NULL, -- 'self_report', 'quiz', 'biometric', 'inferred'
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00

  -- Context
  emotional_labels TEXT[], -- ['anxious', 'tired', 'overwhelmed']
  physical_sensations TEXT[], -- ['tight_chest', 'numb', 'tense']
  situation_context TEXT, -- Optional user note

  -- Biometric Data (if available)
  hrv_score DECIMAL(5,2), -- Heart rate variability
  heart_rate INTEGER,
  respiratory_rate INTEGER,
  sleep_quality INTEGER, -- 1-10
  activity_level VARCHAR(20), -- 'sedentary', 'light', 'moderate', 'vigorous'

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recorded_at TIMESTAMP WITH TIME ZONE, -- When user actually felt this (may differ from created_at)

  -- Indexes
  INDEX idx_user_created (user_id, created_at DESC),
  INDEX idx_user_vybe_level (user_id, vybe_level),
  INDEX idx_state_category (state_category)
);
```

### Table: `vybe_interventions`

```sql
CREATE TABLE vybe_interventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Intervention Details
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'grounding', 'somatic', 'cognitive', 'spiritual'
  duration_minutes INTEGER,

  -- Applicability
  effective_for_states INTEGER[], -- Array of vybe_level ranges
  contraindicated_for_states INTEGER[], -- States where this SHOULDN'T be used

  -- Content
  instructions TEXT NOT NULL,
  video_url TEXT,
  audio_url TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table: `vybe_intervention_results`

```sql
CREATE TABLE vybe_intervention_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  intervention_id UUID REFERENCES vybe_interventions(id),

  -- Before/After
  state_before_id UUID REFERENCES vybe_states(id),
  state_after_id UUID REFERENCES vybe_states(id),
  vybe_level_change INTEGER, -- Calculated: after - before

  -- User Feedback
  completed BOOLEAN DEFAULT false,
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  user_notes TEXT,

  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  INDEX idx_user_intervention (user_id, intervention_id)
);
```

### Table: `vybe_alerts`

```sql
CREATE TABLE vybe_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Alert Details
  alert_type VARCHAR(50) NOT NULL, -- 'shutdown_detected', 'prolonged_low_state', 'rapid_decline'
  severity VARCHAR(20) NOT NULL, -- 'info', 'warning', 'critical'
  message TEXT NOT NULL,

  -- Related Data
  triggered_by_state_id UUID REFERENCES vybe_states(id),

  -- Response
  viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMP WITH TIME ZONE,
  dismissed BOOLEAN DEFAULT false,
  action_taken VARCHAR(100), -- 'contacted_support', 'did_intervention', 'ignored'

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_user_unviewed (user_id, viewed) WHERE NOT viewed
);
```

### Table: `vybe_patterns`

```sql
CREATE TABLE vybe_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Pattern Details
  pattern_type VARCHAR(50) NOT NULL, -- 'daily_cycle', 'weekly_trend', 'trigger_response'
  description TEXT NOT NULL,

  -- Pattern Data
  time_of_day VARCHAR(20), -- 'morning', 'afternoon', 'evening', 'night'
  day_of_week INTEGER, -- 0-6
  associated_triggers TEXT[],
  typical_vybe_range INTEGER[], -- [min, max]

  -- Statistics
  occurrences INTEGER DEFAULT 1,
  confidence DECIMAL(3,2), -- How sure we are this is a real pattern

  -- Metadata
  first_detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_occurred_at TIMESTAMP WITH TIME ZONE,

  INDEX idx_user_patterns (user_id, pattern_type)
);
```

---

## API Endpoints

### Vybe State Tracking

#### `POST /api/vybe/states`
Record a new vybe state.

**Request Body:**
```json
{
  "vybeLevel": 150,
  "stateCategory": "fear",
  "detectionMethod": "self_report",
  "emotionalLabels": ["anxious", "worried", "restless"],
  "physicalSensations": ["tight_chest", "shallow_breathing"],
  "situationContext": "Big presentation tomorrow",
  "recordedAt": "2025-10-29T10:30:00Z"
}
```

**Response:**
```json
{
  "id": "uuid",
  "vybeLevel": 150,
  "stateCategory": "fear",
  "recommendedInterventions": [
    {
      "id": "uuid",
      "name": "4-7-8 Breathing",
      "category": "grounding",
      "estimatedDuration": 5
    }
  ],
  "alertsGenerated": [],
  "createdAt": "2025-10-29T10:30:15Z"
}
```

#### `GET /api/vybe/states/current`
Get user's most recent vybe state.

**Response:**
```json
{
  "id": "uuid",
  "vybeLevel": 350,
  "stateCategory": "acceptance",
  "emotionalLabels": ["calm", "grounded"],
  "recordedAt": "2025-10-29T08:00:00Z",
  "hoursAgo": 2.5
}
```

#### `GET /api/vybe/states/history`
Get user's vybe state history.

**Query Params:**
- `startDate` (ISO 8601)
- `endDate` (ISO 8601)
- `limit` (default: 100)

**Response:**
```json
{
  "states": [
    {
      "id": "uuid",
      "vybeLevel": 350,
      "stateCategory": "acceptance",
      "recordedAt": "2025-10-29T08:00:00Z"
    }
  ],
  "summary": {
    "averageLevel": 285,
    "trend": "improving", // 'improving', 'stable', 'declining'
    "mostCommonState": "courage"
  }
}
```

#### `GET /api/vybe/states/analytics`
Get analytics and insights about user's vybe patterns.

**Response:**
```json
{
  "weeklyAverage": 325,
  "weeklyTrend": "stable",
  "timeOfDayPattern": {
    "morning": 280,
    "afternoon": 350,
    "evening": 320,
    "night": 250
  },
  "shutdownEpisodes": {
    "count": 2,
    "lastOccurrence": "2025-10-25T14:30:00Z",
    "averageDuration": "3 hours"
  },
  "topTriggers": ["work_stress", "social_situations"],
  "mostEffectiveInterventions": [
    {
      "name": "Walking in Nature",
      "averageImprovement": 85
    }
  ]
}
```

### Interventions

#### `GET /api/vybe/interventions`
Get recommended interventions for current state.

**Query Params:**
- `vybeLevel` (optional, defaults to user's current level)
- `stateCategory` (optional)

**Response:**
```json
{
  "interventions": [
    {
      "id": "uuid",
      "name": "Grounding Exercise: 5-4-3-2-1",
      "description": "Use your senses to anchor in the present",
      "category": "grounding",
      "duration": 5,
      "instructions": "Name 5 things you see...",
      "whyThisHelps": "Brings you out of freeze response into awareness",
      "videoUrl": "https://...",
      "effectivenessForYou": 85 // Based on user history
    }
  ],
  "criticalWarning": null // or "You appear to be in shutdown state..."
}
```

#### `POST /api/vybe/interventions/:id/start`
Log that user started an intervention.

**Response:**
```json
{
  "resultId": "uuid",
  "intervention": {...},
  "startedAt": "2025-10-29T10:35:00Z"
}
```

#### `POST /api/vybe/interventions/:id/complete`
Log completion and effectiveness.

**Request Body:**
```json
{
  "resultId": "uuid",
  "completed": true,
  "effectivenessRating": 4,
  "userNotes": "Felt much calmer after",
  "newVybeLevel": 225
}
```

### Alerts

#### `GET /api/vybe/alerts`
Get user's active alerts.

**Response:**
```json
{
  "alerts": [
    {
      "id": "uuid",
      "type": "shutdown_detected",
      "severity": "critical",
      "message": "We notice you may be in a shutdown state. Let's focus on safety and grounding first.",
      "recommendations": ["Contact support", "Do grounding exercise"],
      "createdAt": "2025-10-29T10:30:00Z"
    }
  ]
}
```

#### `POST /api/vybe/alerts/:id/dismiss`
Dismiss an alert.

**Request Body:**
```json
{
  "actionTaken": "did_intervention"
}
```

### Assessment Quiz

#### `POST /api/vybe/quiz/submit`
Submit quiz responses to calculate vybe level.

**Request Body:**
```json
{
  "responses": {
    "energy_level": 3,
    "emotional_tone": "anxious",
    "physical_sensations": ["tight", "tense"],
    "cognitive_clarity": 4,
    "sense_of_hope": 5,
    "connection_to_others": 3,
    "body_awareness": 2
  }
}
```

**Response:**
```json
{
  "vybeLevel": 285,
  "stateCategory": "courage",
  "confidence": 0.87,
  "explanation": "Your responses suggest you're in a transitional state...",
  "stateId": "uuid"
}
```

---

## State Detection Algorithm

### Self-Report Quiz Scoring

```typescript
interface QuizResponse {
  // 0-10 scales
  energyLevel: number;
  emotionalTone: string; // mapped to category
  physicalSensations: string[];
  cognitiveClarity: number;
  senseOfHope: number;
  connectionToOthers: number;
  bodyAwareness: number;
}

function calculateVybeLevel(responses: QuizResponse): number {
  let baseScore = 0;
  let weights = {
    energy: 0.15,
    emotional: 0.25,
    cognitive: 0.15,
    hope: 0.20,
    connection: 0.15,
    bodyAwareness: 0.10
  };

  // Energy contribution
  baseScore += responses.energyLevel * 10 * weights.energy;

  // Emotional tone (mapped)
  const emotionalScores = {
    'numb': 25,
    'shame': 75,
    'guilt': 90,
    'fearful': 125,
    'angry': 175,
    'frustrated': 200,
    'neutral': 280,
    'hopeful': 320,
    'peaceful': 400,
    'joyful': 550,
    'blissful': 650,
    'transcendent': 800
  };
  baseScore += (emotionalScores[responses.emotionalTone] || 200) * weights.emotional;

  // Cognitive clarity contribution
  baseScore += responses.cognitiveClarity * 10 * weights.cognitive;

  // Hope contribution
  baseScore += responses.senseOfHope * 10 * weights.hope;

  // Connection contribution
  baseScore += responses.connectionToOthers * 10 * weights.connection;

  // Body awareness (inverted for dissociation detection)
  if (responses.bodyAwareness < 3) {
    // Low body awareness = possible dissociation
    baseScore = Math.min(baseScore, 100); // Cap at shame/guilt range
  }
  baseScore += responses.bodyAwareness * 10 * weights.bodyAwareness;

  // Physical sensations adjustment
  const dissociativeMarkers = ['numb', 'disconnected', 'foggy', 'nothing'];
  const hasD dissociativeMarkers = responses.physicalSensations.some(s =>
    dissociativeMarkers.includes(s.toLowerCase())
  );

  if (hasDissociativeMarkers && baseScore < 200) {
    baseScore = Math.max(0, baseScore - 50); // Pull toward shutdown range
  }

  return Math.round(Math.max(0, Math.min(1000, baseScore)));
}
```

### Shutdown Detection Algorithm

```typescript
interface ShutdownIndicators {
  lowBodyAwareness: boolean; // <3/10
  emotionalNumbness: boolean; // "numb", "nothing", "empty"
  cognitiveImpairment: boolean; // clarity <4/10
  lowEnergy: boolean; // <2/10
  dissociativeLanguage: boolean; // "disconnected", "foggy", "unreal"
}

function detectShutdown(
  vybeLevel: number,
  indicators: ShutdownIndicators,
  hrvData?: number
): { isShutdown: boolean; confidence: number } {

  let shutdownScore = 0;

  // Primary indicators
  if (vybeLevel < 100) shutdownScore += 3;
  if (indicators.lowBodyAwareness) shutdownScore += 2;
  if (indicators.emotionalNumbness) shutdownScore += 3;
  if (indicators.cognitiveImpairment) shutdownScore += 1;
  if (indicators.lowEnergy) shutdownScore += 2;
  if (indicators.dissociativeLanguage) shutdownScore += 2;

  // Biometric data (if available)
  if (hrvData && hrvData < 20) shutdownScore += 3; // Very low HRV

  const maxScore = 16; // 13 + 3 for HRV
  const confidence = shutdownScore / maxScore;
  const isShutdown = confidence >= 0.60; // 60% threshold

  return { isShutdown, confidence };
}
```

### Pattern Detection

```typescript
interface StatePattern {
  type: 'daily_cycle' | 'weekly_trend' | 'trigger_response';
  description: string;
  confidence: number;
}

async function detectPatterns(
  userId: string,
  lookbackDays: number = 30
): Promise<StatePattern[]> {
  const states = await getStateHistory(userId, lookbackDays);
  const patterns: StatePattern[] = [];

  // Time-of-day patterns
  const timeOfDayScores = {
    morning: [] as number[],
    afternoon: [] as number[],
    evening: [] as number[],
    night: [] as number[]
  };

  states.forEach(state => {
    const hour = new Date(state.recordedAt).getHours();
    const period =
      hour < 12 ? 'morning' :
      hour < 17 ? 'afternoon' :
      hour < 21 ? 'evening' : 'night';

    timeOfDayScores[period].push(state.vybeLevel);
  });

  // Find significant time-of-day dips
  Object.entries(timeOfDayScores).forEach(([period, scores]) => {
    if (scores.length < 5) return; // Need enough data

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const overallAvg = states.reduce((a, s) => a + s.vybeLevel, 0) / states.length;

    if (avg < overallAvg - 50) {
      patterns.push({
        type: 'daily_cycle',
        description: `Your vybe tends to dip in the ${period} (avg ${Math.round(avg)} vs ${Math.round(overallAvg)} overall)`,
        confidence: Math.min(0.95, scores.length / 30)
      });
    }
  });

  // Shutdown frequency pattern
  const shutdownStates = states.filter(s => s.vybeLevel < 100);
  if (shutdownStates.length >= 3) {
    const avgDaysBetween = calculateAvgDaysBetween(shutdownStates);
    patterns.push({
      type: 'trigger_response',
      description: `Shutdown episodes occur approximately every ${Math.round(avgDaysBetween)} days`,
      confidence: Math.min(0.90, shutdownStates.length / 10)
    });
  }

  return patterns;
}
```

---

## Biometric Integration

### Supported Devices/APIs

1. **Apple HealthKit** (iOS)
   - Heart Rate Variability (HRV)
   - Heart Rate
   - Respiratory Rate
   - Sleep Analysis
   - Activity Level

2. **Google Fit** (Android)
   - Similar metrics

3. **Oura Ring API**
   - Excellent HRV data
   - Sleep quality
   - Readiness score

4. **Whoop API**
   - HRV
   - Recovery score
   - Strain

### HRV Score Mapping

```typescript
function mapHRVToVybeImpact(hrv: number): number {
  // HRV typically ranges from 20-100ms (RMSSD)
  // Lower HRV = more stressed/shutdown
  // Higher HRV = more balanced/elevated

  if (hrv < 20) return -100; // Severe dysfunction, likely shutdown
  if (hrv < 30) return -50;  // High stress
  if (hrv < 50) return 0;    // Neutral
  if (hrv < 70) return +50;  // Good
  return +100;               // Excellent
}
```

### Privacy & Security

**Data Handling:**
- All biometric data encrypted at rest
- Never shared with third parties
- User can delete all biometric data
- Optional: Can use Vyberology WITHOUT biometrics

**Permissions:**
- Request biometric access explicitly
- Explain exactly what data we use and why
- Allow users to revoke access anytime

---

## Alert System Architecture

### Alert Triggers

```typescript
enum AlertType {
  SHUTDOWN_DETECTED = 'shutdown_detected',
  PROLONGED_LOW_STATE = 'prolonged_low_state',
  RAPID_DECLINE = 'rapid_decline',
  PATTERN_DISRUPTION = 'pattern_disruption',
  POSITIVE_MILESTONE = 'positive_milestone'
}

interface AlertRule {
  type: AlertType;
  condition: (states: VybeState[]) => boolean;
  severity: 'info' | 'warning' | 'critical';
  message: (context: any) => string;
  recommendations: string[];
}

const alertRules: AlertRule[] = [
  {
    type: AlertType.SHUTDOWN_DETECTED,
    condition: (states) => {
      const latest = states[0];
      return latest.vybeLevel < 100 && latest.stateCategory === 'shutdown';
    },
    severity: 'critical',
    message: () => "We notice you may be experiencing emotional shutdown. This is a trauma response, not a failure.",
    recommendations: [
      'Try gentle grounding exercises',
      'Reach out to a trusted person',
      'Contact crisis support if needed'
    ]
  },
  {
    type: AlertType.PROLONGED_LOW_STATE,
    condition: (states) => {
      const last7Days = states.slice(0, 7);
      return last7Days.length >= 5 &&
             last7Days.every(s => s.vybeLevel < 200);
    },
    severity: 'warning',
    message: (context) => `You've been in a challenging emotional space for ${context.days} days. Would you like support?`,
    recommendations: [
      'Consider reaching out to a therapist',
      'Review what interventions have helped before',
      'Check in with your support network'
    ]
  },
  {
    type: AlertType.RAPID_DECLINE,
    condition: (states) => {
      if (states.length < 2) return false;
      const decline = states[1].vybeLevel - states[0].vybeLevel;
      return decline > 150; // Dropped 150+ points
    },
    severity: 'warning',
    message: (context) => `Your vybe has dropped significantly. What happened?`,
    recommendations: [
      'Take time to process',
      'Journal about what triggered this',
      'Practice self-compassion'
    ]
  },
  {
    type: AlertType.POSITIVE_MILESTONE,
    condition: (states) => {
      const latest = states[0];
      const previousHigh = Math.max(...states.slice(1, 30).map(s => s.vybeLevel));
      return latest.vybeLevel >= 500 && latest.vybeLevel > previousHigh;
    },
    severity: 'info',
    message: () => "You've reached a new high vybe state! Celebrate this moment.",
    recommendations: [
      'Journal about what contributed to this',
      'Notice how your body feels',
      'Anchor this feeling for future access'
    ]
  }
];
```

### Emergency Resources

When critical shutdown detected, provide:

```typescript
const emergencyResources = {
  us: {
    suicide_prevention: '988',
    crisis_text_line: 'Text HOME to 741741',
    domestic_violence: '1-800-799-7233'
  },
  uk: {
    samaritans: '116 123',
    crisis_text_line: 'Text SHOUT to 85258'
  },
  // ... other countries
};
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('Vybe State Detection', () => {
  it('should detect shutdown state from quiz responses', () => {
    const responses = {
      energyLevel: 1,
      emotionalTone: 'numb',
      physicalSensations: ['disconnected', 'foggy'],
      cognitiveClarity: 2,
      senseOfHope: 1,
      connectionToOthers: 1,
      bodyAwareness: 1
    };

    const result = calculateVybeLevel(responses);
    expect(result).toBeLessThan(100);
  });

  it('should not trigger shutdown alert for temporary low state', () => {
    const states = [
      { vybeLevel: 150, stateCategory: 'fear', recordedAt: new Date() }
    ];

    const shouldAlert = checkAlertConditions(states);
    expect(shouldAlert.find(a => a.type === 'shutdown_detected')).toBeUndefined();
  });
});
```

### Integration Tests

- Test full flow: quiz → state calculation → recommendations → intervention → follow-up
- Test biometric data integration
- Test alert system with various scenarios
- Test pattern detection with synthetic data

### User Acceptance Testing

- Validate language is trauma-sensitive
- Ensure interventions are appropriate for states
- Verify emergency resources are accessible
- Test with focus groups from various backgrounds

---

## Performance Considerations

### Caching Strategy

```typescript
// Cache user's current state (TTL: 15 minutes)
const currentStateKey = `vybe:current:${userId}`;

// Cache recent history (TTL: 1 hour)
const historyKey = `vybe:history:${userId}:${startDate}`;

// Cache patterns (TTL: 24 hours, invalidate on new state)
const patternsKey = `vybe:patterns:${userId}`;
```

### Query Optimization

- Index on `user_id + created_at` for history queries
- Index on `user_id + vybe_level` for analytics
- Use materialized views for aggregate statistics
- Batch process pattern detection (run nightly)

### Rate Limiting

- State recording: 1 per minute (prevent spam)
- Analytics queries: 10 per minute
- Intervention recommendations: 30 per minute

---

## Roadmap

### Phase 1 (MVP) ✅
- Basic state tracking via self-report
- Quiz-based detection
- Simple intervention recommendations
- History visualization

### Phase 2
- Pattern detection
- Alert system
- Life Path integration
- Practitioner portal (read-only)

### Phase 3
- Biometric integration (HealthKit/Google Fit)
- Advanced analytics
- Predictive insights
- Community features (anonymous sharing)

### Phase 4
- Wearable device partnerships
- Real-time state monitoring
- AI-powered personalization
- Research integration (with user consent)

---

## Privacy & Compliance

### GDPR Compliance
- Right to access: Export all user data
- Right to erasure: Delete all user data
- Right to portability: JSON export
- Privacy by design: Minimal data collection

### HIPAA Considerations
- Vyberology is NOT a medical device
- Not diagnosing or treating conditions
- Clear disclaimers throughout
- Recommend professional help when appropriate

### Data Retention
- Active users: Indefinite (user-controlled)
- Inactive users (1 year): Prompt to review/delete
- Deleted accounts: 30-day grace period, then permanent deletion

---

## Success Metrics

### User Engagement
- Daily active users tracking vybe state
- Average states recorded per week
- Intervention completion rate

### Effectiveness
- Average vybe level improvement after interventions
- Time to recovery from shutdown episodes
- User-reported effectiveness ratings

### Safety
- Shutdown detection accuracy
- False positive rate for alerts
- Crisis resource click-through rate

### Business
- Feature adoption rate
- User retention (30/60/90 day)
- Premium upgrade rate (if applicable)

---

**Built by Nova + Tungsten**
**Version: 1.0**
**Last Updated: 2025-10-29**
