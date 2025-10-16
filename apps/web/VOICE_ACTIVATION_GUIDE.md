# Voice Activation Guide for Vyberology

This guide explains how to set up voice activation for Vyberology across different platforms and methods.

## Table of Contents
1. [In-App Voice Assistant ("Hey Lumen")](#in-app-voice-assistant)
2. [iOS Siri Shortcuts](#ios-siri-shortcuts)
3. [Android Google Assistant Actions](#android-google-assistant)
4. [Home Screen Widgets](#home-screen-widgets)

---

## In-App Voice Assistant

### Overview
When the Vyberology app is open and in the foreground, you can use the built-in "Hey Lumen" voice assistant.

### How to Use
1. Open Vyberology app
2. Navigate to **Get Vybe** → **Advanced Options**
3. Select the **Voice** tab
4. Tap **"Start Listening"**
5. Say **"Hey Lumen"** followed by your command

### Supported Commands
- **"Hey Lumen, what's the vybe?"** - Captures current time and generates reading
- **"Hey Lumen, read [number]"** - Generates reading for specific number (e.g., "Hey Lumen, read 11:11")
- **"Hey Lumen, show history"** - Opens your reading history
- **"Hey Lumen, [question]"** - Asks Lumen a question about numerology

### Visual Feedback
- **Pulsing Logo**: Lumen is actively listening
- **Glowing Border**: Wake word detected, processing command
- **Live Transcript**: See what Lumen hears in real-time

### Permissions Required
- **Microphone Access**: Required for voice recognition
- Grant permission when prompted on first use
- iOS: Settings → Vyberology → Microphone
- Android: Settings → Apps → Vyberology → Permissions → Microphone

---

## iOS Siri Shortcuts

### Overview
Use Siri to activate Vyberology from anywhere on your iPhone, even when the app is closed.

### Setup Instructions

#### Step 1: Create the Shortcut
1. Open the **Shortcuts** app on your iPhone
2. Tap the **+** button to create a new shortcut
3. Tap **Add Action**
4. Search for **"Open App"**
5. Select **Open App** action
6. Choose **Vyberology** from the app list

#### Step 2: Add URL Scheme (Optional - for direct actions)
To open directly to a specific feature:
1. Add another action: **"Open URL"**
2. Enter one of these URLs:
   - `vyberology://capture` - Capture current time
   - `vyberology://history` - Open reading history
   - `vyberology://numerology` - Open numerology reader

#### Step 3: Name Your Shortcut
1. Tap the shortcut name at the top
2. Rename to **"What's the Vybe"** (or your preferred phrase)
3. Tap **Done**

#### Step 4: Add to Siri
1. Tap the shortcut you just created
2. Tap the **(i)** info button
3. Tap **"Add to Siri"**
4. Tap the red record button
5. Say your activation phrase: **"What's the Vybe"**
6. Tap **Done**

### Usage
Now you can activate from anywhere:
- **"Hey Siri, what's the vybe"** - Opens Vyberology and captures time
- Works from lock screen, CarPlay, AirPods, HomePod
- No need to unlock phone first

### Advanced: Automation Triggers
Create automated triggers in the Shortcuts app:
- **Time-based**: "Capture vybe at 11:11 AM daily"
- **Location**: "Capture vybe when I arrive at work"
- **Event**: "Capture vybe when I start meditation"

---

## Android Google Assistant

### Overview
Use Google Assistant to activate Vyberology from anywhere on your Android device.

### Setup Instructions

#### Method 1: App Actions (Built-in)
1. Open **Google Assistant** (say "Hey Google" or long-press home)
2. Say **"Open Vyberology"**
3. Google Assistant will learn your pattern
4. After a few uses, you can say **"Hey Google, capture my vybe"**

#### Method 2: Custom Routines
1. Open the **Google Home** app
2. Tap **Routines** (bottom menu)
3. Tap **+** to create new routine
4. **When**: Add starter
   - Choose **"Voice command"**
   - Enter: **"What's the vybe"**
5. **Then**: Add action
   - Choose **"Open app"**
   - Select **Vyberology**
6. Tap **Save**

### Usage
- **"Hey Google, what's the vybe"** - Opens Vyberology
- **"OK Google, open Vyberology"** - Direct app launch
- Works with any Google Assistant device (phone, smart display, speaker)

### Advanced: Tasker Integration (Power Users)
For advanced automation with Tasker:
1. Install **Tasker** app
2. Create new Task: **"Vybe Capture"**
3. Add action: **App → Launch App → Vyberology**
4. Add action: **Plugin → AutoInput → Send Intent**
   - Action: `app.lovable.eebd950946e542d89b5f15154caa7b65.CAPTURE_VYBE`
5. Link to Google Assistant via AutoVoice plugin

---

## Home Screen Widgets

### iOS Widgets (Coming Soon)

#### Small Widget
- Displays current time
- Tap to capture vybe instantly
- Shows last captured pattern

#### Medium Widget
- Current time + recent reading summary
- Quick actions: Capture, History, New Reading

#### Large Widget
- Full reading preview
- Top 3 recurring patterns
- Quick capture buttons for common patterns (11:11, 222, etc.)

### Android Widgets (Coming Soon)

#### 2x2 Widget (Small)
- Current time display
- Single tap to capture
- Material You theming

#### 4x2 Widget (Medium)
- Time + quick pattern buttons
- Recent reading snippet
- Glassmorphic design

#### 4x4 Widget (Large)
- Full reading display
- Interactive pattern grid
- History preview

---

## Troubleshooting

### Voice Recognition Not Working
**Problem**: "Hey Lumen" not responding

**Solutions**:
- ✅ Check microphone permission in device settings
- ✅ Ensure app is in foreground (not background)
- ✅ Speak clearly, avoid background noise
- ✅ Try disabling/re-enabling in Voice tab
- ✅ Check browser compatibility (Chrome/Safari work best)
- ✅ iOS: Settings → Privacy → Microphone → Vyberology → ON
- ✅ Android: Settings → Apps → Vyberology → Permissions → Microphone → Allow

### Siri Shortcut Not Launching App
**Problem**: Siri says "I couldn't find that app"

**Solutions**:
- ✅ Ensure Vyberology is installed and opened at least once
- ✅ Re-create the shortcut from scratch
- ✅ Update iOS to latest version
- ✅ Try saying the exact phrase you recorded
- ✅ Check Siri & Search settings: Settings → Siri & Search → Vyberology → Learn from this App → ON

### Google Assistant Opens Wrong App
**Problem**: Assistant opens different app or searches web

**Solutions**:
- ✅ Say "Open Vyberology" explicitly first few times
- ✅ Train Assistant: Open app manually, then say "Hey Google, open this app"
- ✅ Use exact phrase from your routine setup
- ✅ Check app name spelling in routine

### Widget Not Updating
**Problem**: Widget shows old data

**Solutions**:
- ✅ Remove and re-add widget
- ✅ Ensure app has background refresh enabled
- ✅ iOS: Settings → General → Background App Refresh → Vyberology → ON
- ✅ Android: Settings → Apps → Vyberology → Battery → Unrestricted

---

## Privacy & Data

### What Data is Collected?
- **Microphone**: Audio is processed locally on your device
- **Voice Recognition**: Uses browser/OS native speech recognition
- **No Cloud Upload**: Voice data is NOT uploaded to Vyberology servers
- **Readings**: Stored locally on your device (localStorage)

### How Voice Data is Processed
1. You speak → Microphone captures audio
2. Browser/OS converts speech to text (Web Speech API)
3. Text is analyzed locally to detect commands
4. Only text commands (not audio) are sent to Vyberology servers for reading generation
5. Audio is immediately discarded after conversion

### Permissions Explained
- **Microphone (Required for Voice)**: Enables "Hey Lumen" wake word detection
- **Notifications (Optional)**: Alerts for scheduled readings
- **Background Refresh (Optional)**: Keeps widgets updated

---

## Best Practices

### For Best Voice Recognition
- 🎤 Speak clearly and at normal pace
- 📢 Use quiet environment (minimize background noise)
- 📱 Hold phone 6-12 inches from mouth
- 🔊 Ensure device volume is not muted
- ⏸️ Pause briefly between "Hey Lumen" and your command

### Command Tips
- ✅ **Good**: "Hey Lumen, what's the vybe?"
- ✅ **Good**: "Hey Lumen, read one one one one"
- ❌ **Avoid**: "Hey Lumen um... what's uh... the vybe?" (too many pauses)
- ❌ **Avoid**: "heylumenwhatsthevybe" (too fast, run together)

### Privacy Tips
- 🔒 Use voice activation only when comfortable
- 📵 Disable microphone permission when not in use
- 🏠 Avoid using in public spaces with sensitive conversations
- 🔕 Turn off voice when not needed (Settings tab)

---

## Future Features (Roadmap)

### Coming Soon
- ⏰ **Scheduled Captures**: "Hey Lumen, remind me to capture at 11:11"
- 🌍 **Multi-language Support**: Spanish, French, Portuguese, Mandarin
- 🎨 **Custom Wake Words**: Choose your own activation phrase
- 🔗 **IFTTT Integration**: Connect to smart home devices
- 🎧 **AirPods/Headphone Optimization**: Better recognition with earbuds

### Under Consideration
- 🗣️ **Voice Responses**: Lumen speaks readings aloud
- 🎵 **Ambient Listening**: Passive pattern detection
- 🤝 **Multi-user Support**: Different voices, different profiles
- 🌙 **Sleep Mode**: Gentle voice activation for bedtime readings

---

## Support

### Need Help?
- 📧 Email: legal@hwinnwin.com
- 🐛 Report issues: https://github.com/hwinnwin/Vyberology/issues
- 📖 Documentation: https://docs.vyberology.com (coming soon)

### Feedback
We'd love to hear how you're using voice activation!
- Share your custom Siri Shortcuts
- Suggest new voice commands
- Request features

---

**Last Updated**: January 2025
**Version**: 1.0.0
