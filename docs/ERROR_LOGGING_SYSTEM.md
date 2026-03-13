# Advanced Error Logging & Feedback Loop System

**Created:** October 29, 2025
**Status:** Ready for Implementation
**For:** Vyberology Web App

---

## Overview

Comprehensive error tracking, user feedback, and recovery system that provides:
- Real-time error monitoring
- User journey tracking
- Automatic error recovery
- User feedback collection
- Performance impact analysis
- Privacy-first data handling

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERACTION                        │
│  - Clicks, inputs, navigation, API calls                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Track Actions
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              ADVANCED ERROR TRACKING SERVICE                 │
│  - User journey tracking (last 50 actions)                  │
│  - Automatic error categorization                           │
│  - Context enrichment (network, performance, device)        │
│  - Recovery attempt logic                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
           ┌───────────┴────────────┐
           │                        │
           ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐
│   SENTRY.IO         │  │   SUPABASE          │
│   - Real-time       │  │   - Error analytics │
│   - Session replay  │  │   - User feedback   │
│   - Performance     │  │   - Recovery metrics│
└─────────────────────┘  └─────────────────────┘
           │                        │
           └───────────┬────────────┘
                       │
                       ▼
           ┌────────────────────────┐
           │    ERROR ANALYTICS      │
           │    DASHBOARD            │
           └────────────────────────┘
```

---

## Components

### 1. Advanced Error Tracking Service
**File:** `src/lib/advanced-error-tracking.ts`

**Features:**
- Automatic error categorization (10 categories)
- Severity determination (critical, error, warning, info)
- User journey tracking (last 50 actions)
- Context enrichment (network, device, performance)
- Session management
- Recovery tracking

**Categories:**
- `network` - Network failures, timeouts
- `database` - Supabase errors, query failures
- `authentication` - Login, token issues
- `validation` - Form validation, input errors
- `permission` - Access denied, unauthorized
- `performance` - Slow operations, memory issues
- `ui` - Render errors, component failures
- `business_logic` - Application logic errors
- `third_party` - External service failures
- `unknown` - Uncategorized errors

**Severity Levels:**
- `critical` - System-breaking (auth, database)
- `error` - Blocks user flow (permissions, business logic)
- `warning` - Recoverable (network, validation)
- `info` - Minor issues

**Usage:**
```typescript
import { trackError, trackClick, trackNavigation } from '@/lib/advanced-error-tracking';

// Track an error
const errorId = await trackError(error, {
  component: 'GetVybe',
  action: 'generate_reading',
  severity: 'error',
  metadata: { hasName: true, hasDob: true }
});

// Track user actions
trackClick('generate-button', { readingType: 'numerology' });
trackNavigation('/get-vybe');

// Set user context
setUser(userId, 'premium');
```

### 2. Error Feedback Component
**File:** `src/components/ErrorFeedback.tsx`

**Features:**
- User-friendly error messaging
- Helpful/Not Helpful feedback
- Optional text feedback
- Privacy-protected display
- Auto-dismiss after submission

**Usage:**
```tsx
<ErrorFeedback
  errorId={errorId}
  errorMessage="Failed to generate reading"
  recoveryAttempted={true}
  recovered={false}
  onClose={() => setShowFeedback(false)}
/>
```

### 3. Error Boundary
**File:** `src/components/ErrorBoundary.tsx` (existing, enhanced)

**Features:**
- Catches React component errors
- Automatic recovery attempts (exponential backoff)
- Graceful degradation
- User-friendly error UI
- Integration with error tracking

**Usage:**
```tsx
<ErrorBoundary component="MyComponent">
  <MyComponent />
</ErrorBoundary>

// Or with HOC
export default withErrorBoundary(MyComponent, 'MyComponent');
```

### 4. Database Schema
**File:** `supabase/migrations/20251029_error_logging_system.sql`

**Tables:**
- `error_logs` - Main error logging table

**Fields:**
- Identifiers: error_id, session_id, user_id
- Classification: category, severity, component, action
- Error details: message, stack
- Context: route, user_agent, network_status, viewport
- Performance: memory_usage, page_load_time, time_on_page
- User journey: recent_actions (JSONB)
- Recovery: recovery_attempted, recovered
- Feedback: user_feedback_helpful, user_feedback_message
- Metadata: Additional context (JSONB)

**Functions:**
- `get_error_analytics(time_range, session_id, user_id)` - Get error metrics
- `get_error_trends(time_range, interval_bucket)` - Get time-series data
- `cleanup_old_error_logs(retention_days)` - Cleanup utility

**RLS Policies:**
- Anyone can insert errors
- Users can view their own errors
- Users can update their own feedback
- Service role can view all errors

---

## Implementation Steps

### Step 1: Run Database Migration

```bash
# Apply the migration
supabase db push

# Or via Supabase Dashboard:
# SQL Editor → Run migration file
```

### Step 2: Update main.tsx

```typescript
// Import advanced tracking
import { errorTracking } from '@/lib/advanced-error-tracking';

// Initialize tracking
errorTracking.setUser(user?.id, user?.segment);

// Track navigation
router.subscribe((location) => {
  errorTracking.trackNavigation(location.pathname);
});
```

### Step 3: Wrap App with Error Boundary

```tsx
// In App.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary component="App">
      <Router>
        {/* ... */}
      </Router>
    </ErrorBoundary>
  );
}
```

### Step 4: Track Critical Actions

```typescript
// Example: Track reading generation
async function generateReading(name: string, dob: string) {
  trackClick('generate-reading', { hasName: !!name, hasDob: !!dob });

  try {
    const result = await api.generateReading(name, dob);
    trackPerformance('reading_generation_time', Date.now() - startTime);
    return result;
  } catch (error) {
    const errorId = await trackError(error, {
      component: 'GetVybe',
      action: 'generate_reading',
      metadata: { hasName: !!name, hasDob: !!dob }
    });

    // Show feedback UI
    setErrorFeedback({ errorId, message: error.message });
  }
}
```

### Step 5: Add Error Recovery

```typescript
// Implement retry logic
async function fetchWithRetry(url: string, maxRetries = 3) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url);
    } catch (error) {
      lastError = error;

      if (i < maxRetries - 1) {
        // Exponential backoff
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
        errorTracking.mark RecoveryAttempted(errorId, false);
      }
    }
  }

  const errorId = await trackError(lastError, {
    category: 'network',
    metadata: { url, retriesAttempted: maxRetries }
  });

  throw lastError;
}
```

---

## Error Analytics Dashboard

### Querying Error Data

```typescript
import { supabase } from '@/lib/supabase';

// Get analytics for last 24 hours
const { data } = await supabase.rpc('get_error_analytics', {
  time_range: '24h'
});

console.log(data);
// {
//   total_errors: 42,
//   by_category: { network: 20, validation: 10, ... },
//   by_severity: { critical: 2, error: 15, ... },
//   top_components: [{ component: 'GetVybe', count: 12 }, ...],
//   recovery_rate: 75.5,
//   feedback_helpful_rate: 85.2
// }
```

### Building a Dashboard Component

```tsx
function ErrorAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    async function loadAnalytics() {
      const { data } = await supabase.rpc('get_error_analytics', {
        time_range: '24h'
      });
      setAnalytics(data);
    }
    loadAnalytics();
  }, []);

  if (!analytics) return <Loading />;

  return (
    <div>
      <StatCard title="Total Errors" value={analytics.total_errors} />
      <StatCard title="Recovery Rate" value={`${analytics.recovery_rate}%`} />
      <CategoryBreakdown data={analytics.by_category} />
      <TopComponents data={analytics.top_components} />
    </div>
  );
}
```

---

## Privacy & Security

### PII Protection

**Automatic Scrubbing:**
- Names → `[REDACTED]`
- Dates of birth → `[DATE_REDACTED]`
- Emails → `[EMAIL_REDACTED]`
- Phone numbers → `[PHONE_REDACTED]`

**What We Track:**
- Error types and categories
- Component names and actions
- Performance metrics
- Network conditions
- Device/viewport info
- User journey (action types only, no PII)

**What We Don't Track:**
- Personal names
- Dates of birth
- Numerology calculation inputs
- Reading content
- Passwords or tokens

### GDPR Compliance

**User Rights:**
- ✅ Right to access (users can view their errors)
- ✅ Right to erasure (RLS policies allow deletion)
- ✅ Right to data portability (JSON export available)
- ✅ Privacy by design (PII scrubbing automatic)

**Data Retention:**
- Default: 90 days
- Run `cleanup_old_error_logs(90)` periodically
- Or via cron: `SELECT cron.schedule('cleanup-errors', '0 2 * * *', 'SELECT cleanup_old_error_logs(90)')`

---

## Best Practices

### 1. Categorize Errors Correctly

```typescript
// Good ✅
trackError(error, {
  category: 'network',
  severity: 'warning',
  component: 'ReadingGenerator'
});

// Bad ❌
trackError(error); // Auto-categorization less accurate
```

### 2. Provide Useful Metadata

```typescript
// Good ✅
trackError(error, {
  component: 'GetVybe',
  action: 'generate_reading',
  metadata: {
    readingType: 'numerology',
    hasName: true,
    hasDob: true,
    attemptNumber: 2
  }
});

// Bad ❌
trackError(error, { component: 'GetVybe' });
```

### 3. Track User Journey

```typescript
// Track important actions
trackClick('cta-button', { location: 'hero' });
trackNavigation('/numerology');
trackApiCall('/api/readings/generate');
```

### 4. Show Appropriate Feedback

```typescript
// Critical errors - show recovery UI
if (severity === 'critical') {
  setErrorFeedback({ errorId, showRecovery: true });
}

// Warnings - toast notification
if (severity === 'warning') {
  toast.warning('Slow network detected');
}

// Info - silent logging
if (severity === 'info') {
  // Just log, no UI
}
```

### 5. Monitor Recovery Rates

```typescript
// Track recovery attempts
try {
  await retryOperation();
  markRecoveryAttempted(errorId, true); // ✅ Recovered
} catch (err) {
  markRecoveryAttempted(errorId, false); // ❌ Failed
}
```

---

## Performance Monitoring

### Track Key Metrics

```typescript
// Page load time
trackPerformance('page_load', window.performance.timing.loadEventEnd - window.performance.timing.navigationStart);

// API latency
const start = Date.now();
await api.call();
trackPerformance('api_latency', Date.now() - start, { endpoint: '/readings' });

// Reading generation time
trackPerformance('reading_generation', generationTime, { type: 'numerology' });
```

### Set Performance Budgets

```typescript
const PERFORMANCE_BUDGETS = {
  page_load: 3000, // 3s
  api_latency: 1000, // 1s
  reading_generation: 2000, // 2s
};

if (metric > PERFORMANCE_BUDGETS[metricName]) {
  trackError(`Slow ${metricName}`, {
    category: 'performance',
    severity: 'warning',
    metadata: { actual: metric, budget: PERFORMANCE_BUDGETS[metricName] }
  });
}
```

---

## Testing

### Unit Tests

```typescript
describe('ErrorTracking', () => {
  it('should categorize network errors', () => {
    const category = categorizeError(new Error('Failed to fetch'));
    expect(category).toBe('network');
  });

  it('should determine severity correctly', () => {
    const severity = determineSeverity(error, 'authentication');
    expect(severity).toBe('critical');
  });

  it('should track user actions', () => {
    trackClick('button');
    expect(userActions).toHaveLength(1);
    expect(userActions[0].type).toBe('click');
  });
});
```

### Integration Tests

```typescript
it('should log error to database', async () => {
  const errorId = await trackError(new Error('Test error'));

  const { data } = await supabase
    .from('error_logs')
    .select('*')
    .eq('error_id', errorId)
    .single();

  expect(data).toBeDefined();
  expect(data.category).toBe('unknown');
});
```

---

## Monitoring & Alerts

### Sentry Alerts

Set up alerts for:
- Critical errors (instant notification)
- Error rate spikes (>10% increase in 5min)
- New error types
- Low recovery rates (<50%)

### Database Alerts

```sql
-- Example: Alert on critical errors
CREATE OR REPLACE FUNCTION notify_critical_error()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.severity = 'critical' THEN
    PERFORM pg_notify('critical_error', row_to_json(NEW)::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER critical_error_notification
  AFTER INSERT ON error_logs
  FOR EACH ROW
  EXECUTE FUNCTION notify_critical_error();
```

---

## Roadmap

### Phase 1 (Current) ✅
- Advanced error tracking service
- User feedback component
- Database schema
- Basic analytics

### Phase 2 (Next)
- Error analytics dashboard
- Automated recovery mechanisms
- Performance budgets
- A/B testing for error messages

### Phase 3 (Future)
- Machine learning for error prediction
- Automatic error categorization improvement
- User segment-specific error handling
- Integration with support system

---

## Support

**Issues:**
- Check Sentry dashboard for real-time errors
- Query Supabase for historical data
- Review user feedback for improvements

**Questions:**
- See code comments in `advanced-error-tracking.ts`
- Check Sentry docs: https://docs.sentry.io
- Supabase docs: https://supabase.com/docs

---

**Built with 💜 by the Vyberology Team**
**Keeping users informed and recovering gracefully since 2025** ✨

