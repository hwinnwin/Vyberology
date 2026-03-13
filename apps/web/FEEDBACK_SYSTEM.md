# Vyberology Feedback System

**Philosophy**: Show up as we are. If we're flawless, great. If we have problems, we acknowledge them and improve based on user feedback.

## Overview

Built-in feedback system that allows users to submit:
- 🐛 Bug Reports
- 💡 Feature Requests
- 📈 Improvements
- 💬 General Feedback

## Features

### ✅ User Experience
- **Floating Button**: Always accessible in bottom-right corner
- **Simple Form**: Easy to fill out, no account required
- **Anonymous Option**: Users can submit without email
- **Context Capture**: Automatically captures page URL, browser info, app version
- **Character Limits**: Title (200 chars), Description (2000 chars)
- **Instant Confirmation**: Toast notification on successful submission

### ✅ Data Collected

**Required:**
- Feedback type (bug, feature, improvement, other)
- Title
- Description

**Automatic:**
- User ID (if logged in)
- Page URL
- User agent
- Browser info (language, platform, viewport, screen size)
- App version
- Timestamp

**Optional:**
- Email (for follow-up)

### ✅ Database Schema

**Table: `feedback`**
- Stores all user feedback
- Row Level Security enabled
- Users can view their own feedback
- Anyone can submit (even anonymous)
- Users can update their own feedback within 24 hours

**Statuses:**
- `new` - Just submitted
- `in_progress` - Team is working on it
- `completed` - Resolved
- `wont_fix` - Not planned
- `duplicate` - Already reported

## Implementation

### Files Created

**Database:**
- `/supabase/migrations/20250111_feedback_system.sql` - Database schema

**Services:**
- `/src/services/feedback.ts` - Feedback submission logic

**Components:**
- `/src/components/FeedbackDialog.tsx` - Feedback form modal
- `/src/components/FeedbackButton.tsx` - Floating action button

**Integration:**
- `/src/App.tsx` - FeedbackButton added to app

## Usage

### For Users

1. **Click the purple "Feedback" button** (bottom-right corner of any page)
2. **Select feedback type**:
   - 🐛 Bug Report
   - 💡 Feature Request
   - 📈 Improvement
   - 💬 Other
3. **Fill out the form**:
   - Title (required)
   - Description (required)
   - Email (optional - for follow-up)
4. **Submit** - Done!

### For Developers/Admins

View feedback in Supabase Dashboard:

```sql
-- View all new feedback
SELECT * FROM feedback
WHERE status = 'new'
ORDER BY created_at DESC;

-- View all bug reports
SELECT * FROM feedback
WHERE type = 'bug'
ORDER BY created_at DESC;

-- Get feedback stats
SELECT * FROM get_feedback_stats();
```

### Programmatic Access

```typescript
import { submitFeedback, getUserFeedback, getFeedbackStats } from "@/services/feedback";

// Submit feedback
await submitFeedback({
  type: "bug",
  title: "Payment form doesn't work",
  description: "When I click submit, nothing happens...",
  email: "user@example.com",
});

// Get user's feedback history
const myFeedback = await getUserFeedback();

// Get stats (admin only)
const stats = await getFeedbackStats();
```

## Privacy & Security

✅ **Anonymous Allowed**: Users don't need an account to submit feedback
✅ **Email Optional**: Email only requested for follow-up, not required
✅ **Row Level Security**: Users can only see their own feedback
✅ **No PII Required**: Works without collecting personal information
✅ **Secure Storage**: All data encrypted in Supabase

## Deployment

### 1. Apply Database Migration

```bash
cd /apps/web
supabase db push --linked
```

### 2. Verify Tables Created

```bash
supabase db remote shell
\dt feedback
\q
```

### 3. Test Feedback Submission

1. Run dev server: `npm run dev`
2. Click purple "Feedback" button
3. Submit test feedback
4. Check Supabase dashboard

## Monitoring Feedback

### Supabase Dashboard

1. Go to **Table Editor** → `feedback`
2. View all submissions
3. Filter by type, status, date
4. Update status as you work on items

### Query Examples

```sql
-- Today's feedback
SELECT * FROM feedback
WHERE created_at > CURRENT_DATE
ORDER BY created_at DESC;

-- High priority bugs
SELECT * FROM feedback
WHERE type = 'bug'
  AND status = 'new'
ORDER BY created_at DESC;

-- Feature requests by popularity (if you add upvotes later)
SELECT title, description, created_at
FROM feedback
WHERE type = 'feature'
ORDER BY created_at DESC;

-- User engagement (feedback per user)
SELECT user_id, COUNT(*) as feedback_count
FROM feedback
WHERE user_id IS NOT NULL
GROUP BY user_id
ORDER BY feedback_count DESC;
```

## Future Enhancements

Ideas for improving the feedback system:

- [ ] **Upvoting**: Let users vote on feature requests
- [ ] **Status Updates**: Email users when their feedback is addressed
- [ ] **Public Roadmap**: Show what's being worked on
- [ ] **In-App Responses**: Reply to feedback within the app
- [ ] **Attachments**: Allow screenshot uploads
- [ ] **Feedback Categories**: More granular categorization
- [ ] **Admin Dashboard**: Dedicated feedback management UI
- [ ] **Auto-Tagging**: AI-powered categorization
- [ ] **Duplicate Detection**: Automatically identify similar feedback

## Analytics

Track feedback submission:

```typescript
// Already implemented in the feedback service
trackAnalyticsEvent("feedback_submitted", {
  type: feedback.type,
  hasEmail: !!feedback.email,
  pageUrl: feedback.pageUrl,
});
```

## Best Practices

### Responding to Feedback

1. **Acknowledge quickly** - Users appreciate knowing they were heard
2. **Be transparent** - If you can't fix it, explain why
3. **Follow up** - When you implement a feature request, let them know
4. **Thank users** - Every piece of feedback is a gift

### Processing Feedback

1. **Triage daily** - Review new feedback every day
2. **Categorize properly** - Set status and type accurately
3. **Look for patterns** - Multiple reports of same issue = priority
4. **Track metrics** - Time to resolution, satisfaction, etc.

### Using Feedback for Growth

- **Roadmap Planning**: Let user requests guide development
- **Bug Prioritization**: Fix what's impacting users most
- **Product Validation**: See which features resonate
- **Community Building**: Users who give feedback become advocates

## Philosophy Reminder

> "We show up as we are. If we're flawless then we are. If we got problems then we got problems - we try our best and adjust on feedback."

This feedback system embodies that philosophy. It's honest, transparent, and built for continuous improvement based on real user needs.

---

**Status**: ✅ Deployed and Ready
**Build**: Passing
**Database**: Schema created
**UI**: Floating button on all pages

Let users tell you how to make Vyberology better! 🚀
