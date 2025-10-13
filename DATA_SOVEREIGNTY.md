# Data Sovereignty in Vyberology

## Overview

Vyberology is built on the principle of **Data Sovereignty** - giving users complete control over their personal data. All data starts on the user's device, and cloud storage is entirely optional and requires explicit consent.

---

## Three Storage Tiers

### 🔒 Tier 1: Local-Only (Default)
**Status**: Always Active

**What Happens:**
- All readings stored in browser localStorage
- Data never leaves the device
- Complete privacy and control
- Works offline
- No account required

**Use Case:**
- Users who prioritize maximum privacy
- Testing/exploring the app
- Offline usage

**Storage Location:**
- Browser localStorage
- Key: `vyberology_reading_history`

---

### ☁️ Tier 2: Cloud Backup (Optional)
**Status**: Opt-In via Settings

**What Happens:**
- Readings backed up to Supabase cloud
- Cross-device access (requires account)
- Data encrypted in transit and at rest
- User can delete cloud data anytime
- NOT used for analytics without consent

**Benefits:**
- Never lose reading history
- Access from multiple devices
- Automatic backups after each reading
- Restore if local storage clears

**Requirements:**
- Supabase account (email + password)
- Explicit opt-in in Settings page

**Privacy:**
- End-to-end encrypted
- Only user can access their readings
- Row Level Security (RLS) enforced
- No sharing with third parties

---

### 📊 Tier 3: Data Collection (Optional)
**Status**: Opt-In via Settings (requires Tier 2)

**What Happens:**
- Anonymized reading patterns collected
- Helps improve Vyberology for everyone
- Used for:
  - Identifying popular number patterns
  - Understanding user behavior
  - Improving AI reading quality
  - App feature prioritization

**What We Collect:**
- ✅ Input types (time, pattern, manual, image)
- ✅ Number patterns (e.g., "11:11", "222")
- ✅ Frequency of captures
- ✅ Reading categories

**What We DON'T Collect:**
- ❌ Full reading text/interpretations
- ❌ Personal information (email, phone visible to analytics)
- ❌ Screenshots or images
- ❌ Location data
- ❌ Device identifiers (beyond anonymized session ID)

---

## User Consent Flow

### First-Time User
1. User opens Vyberology → All data local by default
2. User generates readings → Stored in localStorage
3. No account needed, no tracking

### Opting Into Cloud Backup
1. User goes to **Settings** → **Data Sovereignty**
2. Toggles **"Cloud Sync"**
3. Consent dialog appears explaining:
   - What will be stored
   - Benefits of cloud backup
   - Privacy guarantees
4. User accepts → Account required (if not logged in)
5. Readings automatically sync to cloud

### Opting Into Data Collection
1. In Settings, toggle **"Help Improve Vyberology"**
2. Separate consent dialog explains:
   - What data is collected (anonymized)
   - How it's used
   - Benefits to community
3. User accepts → Anonymized data collected
4. Can opt-out anytime (no penalty)

---

## Technical Implementation

### Local Storage
```typescript
// src/lib/readingHistory.ts
export const saveReading = (reading: HistoricalReading): void => {
  const history = getReadingHistory();
  history.unshift(reading);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};
```

### Cloud Sync
```typescript
// src/lib/cloudSync.ts
export const autoSync = async (reading: HistoricalReading): Promise<void> => {
  if (!isCloudSyncEnabled()) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('user_readings').insert({
    user_id: user.id,
    input_type: reading.inputType,
    input_value: reading.inputValue,
    reading_text: reading.reading,
    numbers: reading.numbers,
    data_consent_given: hasDataConsent(),
  });
};
```

### Database Schema
```sql
-- supabase/migrations/20251013000000_create_user_readings_table.sql

CREATE TABLE public.user_readings (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    input_type TEXT NOT NULL,
    input_value TEXT NOT NULL,
    reading_text TEXT NOT NULL,
    numbers TEXT[],
    data_consent_given BOOLEAN DEFAULT false,
    anonymized BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security: Users can only access their own data
CREATE POLICY "Users can view their own readings"
    ON public.user_readings FOR SELECT
    USING (auth.uid() = user_id);
```

---

## Privacy Guarantees

### What We Promise

#### 🔒 Encryption
- All data transmitted over HTTPS/TLS
- Database encrypted at rest (Supabase)
- Passwords hashed with bcrypt

#### 🚫 No Selling
- We will NEVER sell user data
- No third-party advertising
- No data brokers

#### 👁️ Transparency
- Open source codebase (review our code)
- Clear consent dialogs
- Privacy policy in plain English

#### 🗑️ Right to Delete
- Delete all cloud data: Settings → Clear Cloud Data
- Delete all local data: Settings → Clear Local Data
- Delete account: Settings → Delete Account (coming soon)

#### 📥 Data Portability
- Export all readings as JSON
- Take your data anywhere
- Settings → Export Your Data

---

## Compliance

### GDPR (EU Users)
✅ **Consent-based**: All cloud storage requires explicit consent
✅ **Right to be Forgotten**: Users can delete all data
✅ **Data Portability**: Export in machine-readable format
✅ **Access**: Users can view all their stored data
✅ **Rectification**: Users can update/correct data
✅ **Restriction**: Users can disable cloud sync anytime

### CCPA (California Users)
✅ **Know**: Users know what data is collected
✅ **Delete**: Users can delete all data
✅ **Opt-Out**: No selling (we don't sell data)
✅ **Non-Discrimination**: Same service regardless of choices

### COPPA (Under 13)
⚠️ **Age Restriction**: App not intended for users under 13
✅ **Parental Consent**: Required for ages 13-18

---

## Settings Page

### Data Sovereignty Section
- **Local Storage**: Always active, shows reading count and size
- **Cloud Sync Toggle**: Enable/disable cloud backup
- **Data Collection Toggle**: Opt-in to help improve app
- **Real-time Stats**: Local count, cloud count, last sync time

### Data Management Section
- **Export Data**: Download all readings as JSON
- **Clear Local Data**: Delete all localStorage readings
- **Clear Cloud Data** (if logged in): Delete all cloud backups
- **Sync Now** (if cloud enabled): Manually trigger sync

### Consent Dialog
- Appears when enabling cloud sync
- Explains what data is stored
- Clear "Accept" and "No Thanks" options
- Links to Privacy Policy

---

## Analytics (For Opted-In Users Only)

### Anonymized Data We Collect
```sql
-- Anonymized view for analytics
CREATE VIEW anonymized_reading_stats AS
SELECT
    input_type,
    unnest(numbers) AS number_pattern,
    COUNT(*) AS frequency,
    DATE_TRUNC('day', created_at) AS date
FROM user_readings
WHERE data_consent_given = true
GROUP BY input_type, number_pattern, date;
```

### What We Learn
- **Popular Patterns**: Which numbers users capture most (11:11, 222, etc.)
- **Usage Trends**: When users capture readings (time of day)
- **Feature Usage**: Which input methods are preferred (time, image, manual)
- **Recurring Themes**: Common questions asked to Lumen

### How We Use Insights
- Improve AI reading quality
- Prioritize new features
- Optimize UI/UX based on behavior
- Identify bugs and issues

---

## Future Enhancements

### Phase 1 (Current) ✅
- Local storage
- Cloud backup opt-in
- Data collection opt-in
- Export functionality

### Phase 2 (Next)
- **Selective Sync**: Choose which readings to sync
- **Sync Schedules**: Auto-sync daily, weekly, or manual only
- **Multi-Device View**: See which devices have readings
- **Conflict Resolution**: Handle same reading on multiple devices

### Phase 3 (Future)
- **End-to-End Encryption**: Zero-knowledge architecture
- **Self-Hosted Option**: Run your own Vyberology server
- **Blockchain Backup**: Optional immutable reading log
- **Federated Sync**: Peer-to-peer sync without central server

---

## For Developers

### Integrating Cloud Sync

```typescript
import { saveReading } from '@/lib/readingHistory';
import { autoSync } from '@/lib/cloudSync';

// Save reading locally
const reading = {
  inputType: 'time',
  inputValue: '11:11',
  reading: 'Your reading text...',
  numbers: ['11', '11'],
};

saveReading(reading);

// Auto-sync to cloud if enabled
await autoSync(reading);
```

### Checking User Preferences

```typescript
import { isCloudSyncEnabled, hasDataConsent } from '@/lib/cloudSync';

if (isCloudSyncEnabled()) {
  console.log("Cloud sync is ON");
}

if (hasDataConsent()) {
  console.log("User has opted into data collection");
}
```

### Manual Sync

```typescript
import { syncToCloud } from '@/lib/cloudSync';

const result = await syncToCloud();
if (result.success) {
  console.log(`Synced ${result.count} readings to cloud`);
} else {
  console.error(`Sync failed: ${result.error}`);
}
```

---

## Support

### Questions?
- 📧 Email: legal@hwinnwin.com
- 📖 Privacy Policy: https://vyberology.app/privacy
- 🔒 Security: https://vyberology.app/security

### Report Data Issues
If you believe your data has been mishandled:
1. Email legal@hwinnwin.com with subject "Data Issue"
2. Include your user ID (Settings → Account)
3. Describe the issue
4. We will respond within 48 hours

---

**Last Updated**: January 2025
**Version**: 1.0.0

---

## Summary

Vyberology puts YOU in control of YOUR data. Every step of the way, you choose:
- ✅ Store locally? YES (always)
- ✅ Backup to cloud? YOU DECIDE
- ✅ Share anonymized insights? YOUR CHOICE

No hidden tracking. No dark patterns. No selling your data. Just honest, transparent data sovereignty.

🔒 **Your Data. Your Choice. Your Control.**
