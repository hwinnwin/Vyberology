# Mobile Testing Plan - Photo Reading & Voice Assistant

This document outlines the testing plan for photo reading and voice assistant features on the installed Android APK.

## Pre-Test Setup

✅ App installed on Android device
✅ All Supabase Edge Functions deployed (ocr, vybe-reading, generate-reading)
✅ Permissions declared in AndroidManifest.xml (CAMERA, RECORD_AUDIO, READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE)

## Test 1: Photo Reading - Camera Capture

**Steps:**
1. Open Vyberology app
2. Navigate to "Advanced Options" (Get Vybe page)
3. Go to "Upload Image" tab
4. Tap "Take Photo" button

**Expected Behavior:**
- [ ] Camera permission prompt appears (Android shows at bottom of screen)
- [ ] After granting permission, native camera opens
- [ ] Can capture photo
- [ ] Photo preview shows in app
- [ ] "Read Image" button appears
- [ ] Tapping "Read Image" sends photo to OCR function
- [ ] Numbers are extracted and readings displayed

**If Issues Occur, Note:**
- Exact error message shown
- When error appears (before camera opens, after capture, during OCR, etc.)
- Screenshot of error if possible

---

## Test 2: Photo Reading - Photo Library

**Steps:**
1. Go to "Upload Image" tab
2. Tap "Choose Image" button

**Expected Behavior:**
- [ ] Photo library permission prompt appears
- [ ] After granting permission, device photo gallery opens
- [ ] Can select existing photo
- [ ] Photo preview shows in app
- [ ] "Read Image" button appears
- [ ] Tapping "Read Image" processes the photo
- [ ] Readings displayed if numbers found

**If Issues Occur, Note:**
- Which step fails
- Error message
- Whether gallery opens or permission denied

---

## Test 3: Photo Reading - OCR Processing

**Steps:**
1. Capture or select an image with visible numbers (try: clock showing 11:11, license plate, receipt)
2. Tap "Read Image"

**Expected Behavior:**
- [ ] "Reading Frequencies..." loading state shows
- [ ] Within 5-10 seconds, readings appear
- [ ] Multiple readings if multiple numbers detected
- [ ] Each reading shows: input number, interpretation, guidance
- [ ] Toast notification: "Vybe captured! 🌟 Found X frequency signal(s)"

**If Issues Occur, Note:**
- Timeout errors (OCR taking too long?)
- "OCR service not found" error
- No numbers detected (try different image)
- App crash (check logcat)

---

## Test 4: Voice Assistant - Permission Request

**Steps:**
1. Go to "Voice" tab
2. Tap "Start Listening" button

**Expected Behavior:**
- [ ] Permission prompt modal appears (custom Vyberology design)
- [ ] Shows "Enable Voice Commands?" with microphone icon
- [ ] Tap "Allow Microphone" button
- [ ] Browser/system microphone permission prompt appears
- [ ] After granting, toast shows "Permission granted! 🎤"
- [ ] Button changes to "Stop Listening"
- [ ] Status shows "Say 'Hey Lumen'"

**If Issues Occur, Note:**
- Permission prompt doesn't appear
- Permission denied by system
- App doesn't detect permission granted
- Browser doesn't support speech recognition

---

## Test 5: Voice Assistant - Wake Word Detection

**Steps:**
1. With voice assistant listening
2. Say "Hey Lumen"

**Expected Behavior:**
- [ ] Toast notification appears: "👋 Hey there! Lumen is listening..."
- [ ] Lumen avatar pulses faster
- [ ] Status changes to "I'm listening!"
- [ ] Can see transcript of what you're saying

**If Issues Occur, Note:**
- No response to wake word
- Transcript not appearing
- Wrong words detected (speech recognition accuracy issue)

---

## Test 6: Voice Assistant - Commands

**Test Command 1: "Hey Lumen, what's the vybe?"**
- [ ] Captures current time
- [ ] Generates reading for time
- [ ] Reading displays immediately
- [ ] Toast: "Vybe captured! 🌟"

**Test Command 2: "Hey Lumen, read 222"**
- [ ] Generates reading for number 222
- [ ] Reading displays
- [ ] Toast: "Reading generated! 🌟"

**Test Command 3: "Hey Lumen, show history"**
- [ ] Navigates to history page (if implemented)
- [ ] Or shows error if not implemented

**If Issues Occur, Note:**
- Which command fails
- What happens instead
- Error messages

---

## Test 7: Permission Denial Recovery

**Steps:**
1. Deny camera permission when prompted
2. Try to use camera feature again

**Expected Behavior:**
- [ ] Permission prompt modal appears again
- [ ] Shows "Camera Permission Needed" with denied status
- [ ] "Open Settings" button appears
- [ ] Tapping "Open Settings" opens device app settings
- [ ] After enabling in settings, return to app
- [ ] Feature works

**If Issues Occur, Note:**
- Settings don't open
- App doesn't detect permission granted after returning
- Need to restart app?

---

## Test 8: Background/Foreground Switching

**Steps:**
1. Start voice assistant listening
2. Switch to another app
3. Return to Vyberology

**Expected Behavior:**
- [ ] Voice assistant stops when app goes to background
- [ ] Can restart voice assistant when returning to foreground

**If Issues Occur, Note:**
- App crashes when returning
- Voice assistant doesn't work after returning
- Mic stays active in background (battery concern)

---

## Test 9: Quick Patterns

**Steps:**
1. On main Get Vybe page, scroll to "Universe Signals" section
2. Tap any pattern button (11:11, 222, 333, etc.)

**Expected Behavior:**
- [ ] Reading generates immediately
- [ ] No permissions needed
- [ ] Reading displays within 2-3 seconds
- [ ] Can tap multiple patterns in succession

**If Issues Occur, Note:**
- Slow generation
- Errors
- Doesn't work at all

---

## Test 10: Offline Behavior

**Steps:**
1. Turn off WiFi and mobile data
2. Try to use photo reading
3. Try to use voice assistant

**Expected Behavior:**
- [ ] Photo capture still works (local)
- [ ] OCR processing fails with network error (expected)
- [ ] Voice wake word detection works (local)
- [ ] Reading generation fails with network error (expected)
- [ ] Error messages are user-friendly

**If Issues Occur, Note:**
- App crashes instead of showing error
- Confusing error messages
- Features unexpectedly work/don't work

---

## Common Issues & Solutions

### Camera Issues
- **Permission denied**: Check Settings > Apps > Vyberology > Permissions
- **Camera won't open**: Try restarting app
- **Photo very dark**: Check camera works in other apps

### Voice Issues
- **No wake word detection**: Check Settings > Apps > Vyberology > Permissions > Microphone
- **Wrong words detected**: Speak clearly, reduce background noise
- **Browser not supported**: Voice requires Chrome/Edge/Safari with Web Speech API

### OCR Issues
- **Timeout**: OCR function may need more memory, check Supabase logs
- **No numbers detected**: Use image with clear, large numbers
- **Service not found**: Verify OCR function deployed: `npx supabase functions list`

---

## After Testing

Please provide:
1. ✅ Which tests passed
2. ❌ Which tests failed
3. 📝 Exact error messages for failures
4. 📱 Android version and device model
5. 🔍 Any unexpected behavior

This will help diagnose and fix the specific issues you're experiencing.

---

## Quick Commands for Debugging

```bash
# View Supabase function logs
npx supabase functions logs ocr

# Check deployed functions
npx supabase functions list

# Rebuild and sync to device
npm run build && npx cap sync android

# View Android logs (if device connected via USB)
adb logcat | grep -i vyberology
```
