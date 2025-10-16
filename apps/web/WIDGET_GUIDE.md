# Vyberology Home Screen Widgets

Quick access to capture your vybe right from your home screen! Vyberology widgets bring the power of frequency capture to your fingertips.

---

## Overview

Vyberology offers home screen widgets for both iOS and Android that display the current time and provide one-tap access to key app features:

- **Instant Vybe Capture**: Tap to open the capture screen
- **Universe Signals**: Quick access to frequent patterns (11:11, 222, 333, 444)
- **Reading History**: View your past readings
- **Numerology**: Open the numerology calculator

---

## Widget Sizes

### Small Widget (2x2)
Perfect for a quick glance and instant capture.

**Features:**
- Current time display (HH:MM format)
- Vybe logo
- Tap anywhere to capture

**Best for:** Minimalists who want quick access without taking up too much space

---

### Medium Widget (4x2)
Balanced view with more information.

**Features:**
- Current time and date
- "Current Vybe" label
- Large capture button
- Full gradient background

**Best for:** Users who want time info plus easy capture

---

### Large Widget (4x4)
Full dashboard experience on your home screen.

**Features:**
- Current time display
- Quick capture button
- Universe Signals buttons (11:11, 222, 333, 444)
- Navigation shortcuts (History, Numerology)
- Divider sections for organization

**Best for:** Power users who want full feature access from home screen

---

## Installation

### iOS

#### Step 1: Add the Widget
1. Long-press on your home screen (or today view)
2. Tap the **+** button in the top-left corner
3. Search for **"Vyberology"**
4. Select your preferred widget size:
   - Small (2x2)
   - Medium (4x2)
   - Large (4x4)
5. Tap **"Add Widget"**
6. Drag to position and tap **Done**

#### Step 2: Update Frequency
- Widgets update every **1 minute** to show current time
- Tap any widget to open the app and capture your vybe

#### iOS 16+ Lock Screen Widget
1. Long-press on your **Lock Screen**
2. Tap **Customize**
3. Tap on the widgets area (below time)
4. Add **Vyberology** small widget
5. Show time at a glance without unlocking

---

### Android

#### Step 1: Add the Widget
1. Long-press on your home screen
2. Tap **"Widgets"**
3. Scroll to find **"Vyberology"**
4. Long-press and drag to your home screen
5. Choose your size (resize by dragging corners)

#### Step 2: Widget Behavior
- Widgets update every **1 minute**
- Tap to open app features instantly
- Works with all Android launchers (Nova, Pixel, etc.)

---

## Widget Actions

### Capture (All Widgets)
**Action:** Tap the main widget or capture button
**Result:** Opens the "Get Vybe" page to capture current time frequency

**What happens:**
1. App opens to /get-vybe
2. Current time is auto-captured
3. AI generates your reading
4. Reading saved to history (local or cloud)

---

### Universe Signals (Large Widget Only)

Quick buttons for common angel numbers and patterns:

#### 11:11 Button
**Action:** Tap "11:11"
**Result:** Opens Get Vybe with 11:11 pre-filled
**Meaning:** Alignment, manifestation, spiritual awakening

#### 222 Button
**Action:** Tap "222"
**Result:** Opens Get Vybe with 222 pre-filled
**Meaning:** Balance, harmony, trust the process

#### 333 Button
**Action:** Tap "333"
**Result:** Opens Get Vybe with 333 pre-filled
**Meaning:** Divine support, ascended masters

#### 444 Button
**Action:** Tap "444"
**Result:** Opens Get Vybe with 444 pre-filled
**Meaning:** Protection, stability, angels nearby

---

### History (Large Widget Only)
**Action:** Tap "History" button (clock icon)
**Result:** Opens your reading history page
**Shows:** Past readings, patterns, timestamps

---

### Numerology (Large Widget Only)
**Action:** Tap "Numerology" button (number icon)
**Result:** Opens the numerology calculator
**Features:** Life path, expression, soul urge calculations

---

## Design Details

### Color Scheme
Widgets match the app's mystical aesthetic:

- **Background Gradient**: Midnight → Ink (#1C1724 → #120D24)
- **Accent Colors**: Violet → Aurora (#6B45C2 → #A58CFA)
- **Text**: White with varying opacity for hierarchy

### Typography
- **Time**: Bold, 32-40sp (depending on widget size)
- **Labels**: Medium weight, 10-14sp
- **Buttons**: Bold, 16sp

### Visual Elements
- Rounded corners (16dp) for modern look
- Gradient circles for action buttons
- Semi-transparent pattern buttons
- Divider lines for section separation

---

## Technical Details

### Deep Linking

Widgets use the `vyberology://` URL scheme for actions:

- `vyberology://capture` → Opens Get Vybe page
- `vyberology://pattern/11:11` → Opens Get Vybe with 11:11
- `vyberology://pattern/222` → Opens Get Vybe with 222
- `vyberology://pattern/333` → Opens Get Vybe with 333
- `vyberology://pattern/444` → Opens Get Vybe with 444
- `vyberology://history` → Opens reading history
- `vyberology://numerology` → Opens numerology calculator

### Update Frequency

**iOS:**
- Timeline updates every **60 seconds**
- Generates 60 entries (1 per minute for next hour)
- Widget refresh policy: `atEnd` (refreshes when timeline completes)

**Android:**
- Update period: **60000ms (1 minute)**
- Uses `AlarmManager` for precise timing
- Low battery impact (updates only when visible)

### Offline Behavior

- Widgets work offline (show cached time)
- Tapping opens app even without internet
- Readings require internet for AI generation
- Local-only data still accessible offline

---

## Troubleshooting

### Widget Not Showing Up

**iOS:**
- Ensure app is installed from App Store
- Check iOS version (requires iOS 14+)
- Restart your device
- Delete and re-add widget

**Android:**
- Ensure app is installed
- Check Android version (requires Android 5.0+)
- Try a different launcher
- Clear app cache: Settings → Apps → Vyberology → Clear Cache

---

### Widget Not Updating

**iOS:**
- Check Low Power Mode (disables background updates)
- Ensure app isn't offloaded: Settings → General → iPhone Storage
- Force quit app and re-open

**Android:**
- Check Battery Optimization: Settings → Apps → Vyberology → Battery
- Allow background activity
- Disable battery saver for app

---

### Widget Tap Not Working

**iOS:**
- Check app hasn't been deleted
- Ensure you're tapping the interactive areas
- Delete and re-add widget
- Check app isn't restricted: Settings → Screen Time

**Android:**
- Verify app permissions
- Check deep link handling in app settings
- Update to latest app version
- Restart device

---

### Widget Showing Old Time

**Cause:** Widget timeline expired or update paused

**Fix:**
- Tap widget to open app (forces refresh)
- Ensure app has background app refresh enabled
- Check device time/timezone settings
- Wait 1 minute for next scheduled update

---

## Best Practices

### Placement Tips

1. **Lock Screen (iOS)**: Small widget for quick time check
2. **Home Screen Top**: Large widget for full dashboard experience
3. **Secondary Screen**: Medium widget alongside other apps
4. **Today View (iOS)**: Medium or large for quick access from any screen

### Battery Impact

Widgets are designed to be battery-efficient:

- **Minimal**: Small widget (time display only)
- **Low**: Medium widget (time + date)
- **Moderate**: Large widget (multiple interactive elements)

**Estimated Impact:** <1% battery per day

### Privacy Considerations

Widgets show:
- ✅ Current time (public info)
- ✅ App branding
- ✅ Quick action buttons

Widgets **DO NOT** show:
- ❌ Your readings
- ❌ Personal numerology data
- ❌ Reading history
- ❌ Any sensitive information

Safe to use on lock screen without exposing private data!

---

## Customization

### Widget Refresh Rate

**Current:** 60 seconds
**Why:** Balance between accuracy and battery life

**Can I change it?**
- Not user-configurable (for battery optimization)
- Developer can adjust in widget configuration files

### Widget Theme

**Current:** Dark theme with purple gradient
**Future:** May add light theme and color options

**Requested features:**
- Custom gradient colors
- Light/dark mode toggle
- Personalized quick action buttons

---

## Development

### iOS Widget (Swift/SwiftUI)

**Location:** `ios/App/VyberologyWidget/VyberologyWidget.swift`

**Key Components:**
- `Provider`: Timeline provider (generates widget entries)
- `VybeEntry`: Widget data model
- `SmallWidgetView`: 2x2 widget layout
- `MediumWidgetView`: 4x2 widget layout
- `LargeWidgetView`: 4x4 widget layout

**Build Command:**
```bash
npx cap sync ios
npx cap open ios
# Build in Xcode
```

---

### Android Widget (Java/XML)

**Location:** `android/app/src/main/java/.../VyberologyWidgetProvider.java`

**Layouts:**
- `widget_small.xml`: 2x2 grid
- `widget_medium.xml`: 4x2 grid
- `widget_large.xml`: 4x4 grid

**Drawables:**
- `widget_background.xml`: Gradient background
- `widget_capture_circle.xml`: Capture button
- `widget_pattern_button.xml`: Pattern buttons

**Build Command:**
```bash
npx cap sync android
npx cap open android
# Build in Android Studio
```

---

### Deep Link Handling (React)

**Location:** `src/hooks/useDeepLinks.ts`

**How it works:**
1. Capacitor App plugin listens for `appUrlOpen` events
2. Hook parses `vyberology://` URLs
3. React Router navigates to corresponding page
4. State passed to page if needed (e.g., pattern number)

**Testing Deep Links:**

iOS Simulator:
```bash
xcrun simctl openurl booted "vyberology://capture"
xcrun simctl openurl booted "vyberology://pattern/11:11"
```

Android Emulator:
```bash
adb shell am start -W -a android.intent.action.VIEW -d "vyberology://capture"
adb shell am start -W -a android.intent.action.VIEW -d "vyberology://pattern/222"
```

---

## Frequently Asked Questions

### Q: Can I have multiple widgets on one screen?
**A:** Yes! Add as many as you like in different sizes.

### Q: Do widgets work without opening the app first?
**A:** Yes, but app must be installed. Tapping opens the app.

### Q: Can I customize which patterns show in large widget?
**A:** Not yet, but coming soon! Current: 11:11, 222, 333, 444

### Q: Do widgets drain battery?
**A:** Minimal impact (<1% per day). Designed to be efficient.

### Q: Can I use widgets if I'm not logged in?
**A:** Yes! Capture works with local-only storage.

### Q: Will widgets sync between devices?
**A:** Widgets are device-specific, but readings sync if cloud enabled.

### Q: Can I change the widget colors?
**A:** Not currently, but considering theme options for future.

### Q: Do widgets work in landscape mode?
**A:** Yes! Widgets adapt to screen orientation automatically.

---

## Coming Soon

### Planned Features

- **🎨 Custom Themes**: Choose your widget gradient colors
- **🔢 Custom Patterns**: Set your own frequent numbers
- **📊 Mini Stats**: Show reading count or streaks
- **🌙 Dark/Light Mode**: Match system appearance
- **⏰ Reminder Widgets**: Alert you at special times (11:11, 3:33, etc.)
- **📈 Insights Widget**: Show most frequent patterns this week

---

## Feedback

Love the widgets? Have suggestions?

- 📧 Email: legal@hwinnwin.com
- 💬 In-App: Settings → Feedback
- 🐛 Bug Reports: Include widget size, OS version, screenshot

---

## Credits

**Designed by:** Vyberology Team
**Built with:** SwiftUI (iOS), XML/Java (Android), React + Capacitor
**Inspired by:** The universe's synchronicities and your frequency journey ✨

---

**Last Updated:** January 2025
**Version:** 1.0.0

---

## Summary

Vyberology widgets bring the power of frequency capture to your home screen:

- ✅ **Three sizes**: Small, Medium, Large
- ✅ **Real-time clock**: Updates every minute
- ✅ **One-tap capture**: Instant access to Get Vybe
- ✅ **Universe Signals**: Quick access to 11:11, 222, 333, 444
- ✅ **Navigation shortcuts**: History, Numerology
- ✅ **Battery efficient**: Minimal impact
- ✅ **Privacy-first**: No sensitive data shown
- ✅ **Deep linking**: Direct to specific features

**Get started:** Add widget → Tap to capture → Receive your reading! 🌟
