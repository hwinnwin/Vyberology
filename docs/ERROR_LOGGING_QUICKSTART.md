# Error Logging System - Quick Start Guide

**Get the advanced error logging system running in 15 minutes!**

---

## Step 1: Run Database Migration (2 minutes)

```bash
# Navigate to project
cd /Users/mrtungsten/Documents/Projects/4\ Empires/App\ building/Vyberology/Vyberology-main-27.10.25

# Apply migration via Supabase CLI
supabase db push

# Or manually in Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy contents of supabase/migrations/20251029_error_logging_system.sql
# 3. Run the SQL
```

**Verify:**
```sql
-- Check table was created
SELECT * FROM error_logs LIMIT 1;

-- Test analytics function
SELECT get_error_analytics('24h');
```

---

## Step 2: Import Tracking in main.tsx (1 minute)

```typescript
// apps/web/src/main.tsx
import { errorTracking } from "./lib/advanced-error-tracking";

// ... existing code ...

// After user authentication
if (user) {
  errorTracking.setUser(user.id, user.segment);
}

// Track initial page load
errorTracking.trackNavigation(window.location.pathname);
```

---

## Step 3: Add Error Tracking to Key Functions (5 minutes)

### Example 1: API Calls

```typescript
// Before
async function generateReading(name: string, dob: string) {
  const result = await supabase.functions.invoke('generate-reading', {
    body: { name, dob }
  });
  return result;
}

// After ✅
import { trackError, trackApiCall, trackPerformance } from '@/lib/advanced-error-tracking';

async function generateReading(name: string, dob: string) {
  const start = Date.now();

  trackApiCall('/functions/generate-reading', { hasName: !!name, hasDob: !!dob });

  try {
    const result = await supabase.functions.invoke('generate-reading', {
      body: { name, dob }
    });

    trackPerformance('reading_generation', Date.now() - start, { type: 'numerology' });
    return result;

  } catch (error) {
    await trackError(error, {
      component: 'ReadingGenerator',
      action: 'generate_reading',
      category: 'database',
      metadata: { hasName: !!name, hasDob: !!dob }
    });
    throw error;
  }
}
```

### Example 2: User Actions

```typescript
// Track button clicks
import { trackClick } from '@/lib/advanced-error-tracking';

<Button onClick={() => {
  trackClick('generate-reading-button', { location: 'hero' });
  handleGenerateReading();
}}>
  Generate Reading
</Button>
```

### Example 3: Navigation

```typescript
// Track route changes
import { trackNavigation } from '@/lib/advanced-error-tracking';

// In router setup or useEffect
useEffect(() => {
  trackNavigation(location.pathname);
}, [location.pathname]);
```

---

## Step 4: Add Error Feedback UI (3 minutes)

```typescript
// In your component where errors can occur
import { useState } from 'react';
import { ErrorFeedback } from '@/components/ErrorFeedback';
import { trackError } from '@/lib/advanced-error-tracking';

function MyComponent() {
  const [errorFeedback, setErrorFeedback] = useState(null);

  async function handleAction() {
    try {
      // ... your code ...
    } catch (error) {
      const errorId = await trackError(error, {
        component: 'MyComponent',
        action: 'handleAction'
      });

      // Show feedback UI
      setErrorFeedback({
        errorId,
        message: error.message,
        recoveryAttempted: false,
        recovered: false
      });
    }
  }

  return (
    <>
      {/* Your component UI */}

      {/* Error feedback */}
      {errorFeedback && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
          <ErrorFeedback
            {...errorFeedback}
            onClose={() => setErrorFeedback(null)}
          />
        </div>
      )}
    </>
  );
}
```

---

## Step 5: Test It Out! (4 minutes)

### Test Error Logging

```typescript
// Temporarily add to a button click
import { trackError } from '@/lib/advanced-error-tracking';

<Button onClick={async () => {
  const errorId = await trackError(new Error('Test error'), {
    component: 'TestComponent',
    action: 'test_button_click',
    category: 'ui',
    severity: 'info'
  });
  console.log('Error tracked with ID:', errorId);
}}>
  Test Error Logging
</Button>
```

### Verify in Database

```sql
-- Check error was logged
SELECT
  error_id,
  category,
  severity,
  component,
  error_message,
  timestamp
FROM error_logs
ORDER BY timestamp DESC
LIMIT 10;
```

### Test Analytics

```sql
-- Get analytics
SELECT get_error_analytics('1h');
```

### Test in Sentry

1. Go to https://sentry.io
2. Find your Vyberology project
3. Check for the test error
4. Verify breadcrumbs show user journey

---

## Common Patterns

### Pattern 1: Network Requests with Retry

```typescript
import { trackError, errorTracking } from '@/lib/advanced-error-tracking';

async function fetchWithRetry(url: string, maxRetries = 3) {
  let errorId;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (errorId) {
        errorTracking.markRecoveryAttempted(errorId, true);
      }
      return response;
    } catch (error) {
      if (i === 0) {
        errorId = await trackError(error, {
          category: 'network',
          severity: 'warning',
          metadata: { url, attemptNumber: i + 1 }
        });
      }

      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
      } else {
        errorTracking.markRecoveryAttempted(errorId, false);
        throw error;
      }
    }
  }
}
```

### Pattern 2: Form Validation

```typescript
import { trackError } from '@/lib/advanced-error-tracking';

function validateForm(data) {
  const errors = [];

  if (!data.name) errors.push('Name is required');
  if (!data.dob) errors.push('Date of birth is required');

  if (errors.length > 0) {
    trackError(new Error('Form validation failed'), {
      category: 'validation',
      severity: 'info',
      component: 'NumerologyForm',
      metadata: { errors, fields: Object.keys(data) }
    });
  }

  return errors;
}
```

### Pattern 3: Permission Errors

```typescript
import { trackError } from '@/lib/advanced-error-tracking';

async function accessProtectedResource() {
  try {
    const { data, error } = await supabase
      .from('protected_table')
      .select('*');

    if (error?.code === '42501') { // Permission denied
      await trackError(error, {
        category: 'permission',
        severity: 'error',
        component: 'ResourceAccess',
        metadata: { table: 'protected_table' }
      });
      throw new Error('You don\'t have permission to access this resource');
    }

    return data;
  } catch (error) {
    // ... handle error ...
  }
}
```

---

## Monitoring & Debugging

### View Recent Errors

```sql
SELECT
  error_id,
  timestamp,
  category,
  severity,
  component,
  error_message,
  recovered,
  user_feedback_helpful
FROM error_logs
WHERE timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;
```

### Check Recovery Rates

```sql
SELECT
  component,
  COUNT(*) as total_errors,
  COUNT(*) FILTER (WHERE recovery_attempted = true) as recovery_attempts,
  COUNT(*) FILTER (WHERE recovered = true) as successful_recoveries,
  ROUND(
    COUNT(*) FILTER (WHERE recovered = true)::NUMERIC /
    NULLIF(COUNT(*) FILTER (WHERE recovery_attempted = true), 0) * 100,
    2
  ) as recovery_rate_pct
FROM error_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY component
ORDER BY total_errors DESC;
```

### User Feedback Summary

```sql
SELECT
  COUNT(*) as total_feedback,
  COUNT(*) FILTER (WHERE user_feedback_helpful = true) as helpful_count,
  COUNT(*) FILTER (WHERE user_feedback_helpful = false) as not_helpful_count,
  ROUND(
    COUNT(*) FILTER (WHERE user_feedback_helpful = true)::NUMERIC / COUNT(*) * 100,
    2
  ) as helpful_rate_pct,
  array_agg(DISTINCT user_feedback_message) FILTER (WHERE user_feedback_message IS NOT NULL) as sample_messages
FROM error_logs
WHERE user_feedback_helpful IS NOT NULL
  AND timestamp > NOW() - INTERVAL '7 days';
```

---

## Next Steps

1. **Add to all API calls** - Wrap Supabase/external API calls
2. **Add to forms** - Track validation errors
3. **Add to navigation** - Track route changes
4. **Build dashboard** - Create admin view of error analytics
5. **Set up alerts** - Configure Sentry alerts for critical errors

---

## Troubleshooting

### Error: "Table error_logs does not exist"
**Solution:** Run the database migration (Step 1)

### Error: "Permission denied for table error_logs"
**Solution:** Check RLS policies are created. Run migration again.

### Errors not showing in Sentry
**Solution:** Check `VITE_SENTRY_DSN` is set in environment variables

### Errors not logging to database
**Solution:** Check Supabase connection and RLS policies

---

## Performance Tips

1. **Batch user actions** - Don't track every keystroke
2. **Sample high-volume events** - Use sampling for common actions
3. **Async tracking** - Don't await trackError in critical paths
4. **Cleanup old logs** - Run cleanup_old_error_logs() weekly

```typescript
// Good ✅ - Don't block user flow
trackError(error).then(() => {
  // Error logged
});

// Bad ❌ - Blocks user flow
await trackError(error);
doNextThing(); // User has to wait
```

---

**You're all set! The error logging system is now tracking issues and collecting feedback.** 🎉

For full documentation, see [ERROR_LOGGING_SYSTEM.md](./ERROR_LOGGING_SYSTEM.md)
