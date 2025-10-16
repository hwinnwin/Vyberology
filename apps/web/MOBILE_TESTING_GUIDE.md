# Mobile Testing Guide - Android

This guide will help you test Vyberology on your Android device.

## Option 1: Quick Network Testing (Fastest - No Build Required)

This method lets you test immediately using your local dev server.

### Prerequisites
- Your Android phone and computer must be on the same WiFi network

### Steps

1. **Get your computer's local IP address:**

   On Mac/Linux:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

   On Windows:
   ```bash
   ipconfig
   ```

   Look for your local IP (usually something like `192.168.0.24`)

2. **The dev server is already running at:**
   ```
   http://192.168.0.24:8080
   ```

3. **On your Android phone:**
   - Open Chrome browser
   - Type: `http://192.168.0.24:8080`
   - Navigate to the "Get Vybe" page
   - Test the camera features!

**Note:** This uses browser APIs, not native Capacitor features. For full native testing, use Option 2.

---

## Option 2: Full Native Android App (Best Testing Experience)

This builds a native Android app with full Capacitor features.

### Prerequisites

1. **Install Android Studio:**
   - Download from: https://developer.android.com/studio
   - Install and complete the setup wizard

2. **Enable USB Debugging on your Android phone:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times to enable Developer Mode
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"

3. **Connect your phone:**
   - Connect via USB cable
   - Accept the "Allow USB Debugging" prompt on your phone

### Build and Deploy Steps

1. **Add Android platform (if not already added):**
   ```bash
   cd /Users/mrtungsten/Downloads/Vyberology-main-4
   npx cap add android
   ```

2. **Build the web assets:**
   ```bash
   npm run build
   ```

3. **Sync the web assets to Android:**
   ```bash
   npx cap sync android
   ```

4. **Add required permissions to AndroidManifest.xml:**

   The file will be created at: `android/app/src/main/AndroidManifest.xml`

   Add these permissions inside the `<manifest>` tag:
   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-permission android:name="android.permission.RECORD_AUDIO" />
   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
   <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
   <uses-permission android:name="android.permission.INTERNET" />
   ```

5. **Open Android Studio:**
   ```bash
   npx cap open android
   ```

6. **In Android Studio:**
   - Wait for Gradle sync to complete (bottom right status)
   - Select your connected device from the device dropdown (top toolbar)
   - Click the green "Run" button (▶️) or press `Ctrl+R`

7. **On your phone:**
   - The app will install and launch automatically
   - Grant camera/microphone permissions when prompted
   - Test the "Get Vybe" features!

---

## Option 3: Wireless Testing (ADB over WiFi)

If you don't have a USB cable or want wireless testing:

### Steps

1. **First connect via USB and enable wireless debugging:**
   ```bash
   adb tcpip 5555
   ```

2. **Get your phone's IP address:**
   - Settings → About Phone → Status → IP Address
   - Or use: `adb shell ip addr show wlan0`

3. **Connect wirelessly:**
   ```bash
   adb connect YOUR_PHONE_IP:5555
   ```

4. **Disconnect USB cable and continue with Option 2 steps**

---

## Testing Checklist

Once the app is running on your Android phone, test these features:

### Camera Permissions
- [ ] Navigate to "Get Vybe" page
- [ ] Click "Upload Image" tab
- [ ] Click "Take Photo" button
- [ ] Camera permission prompt should appear
- [ ] Grant permission
- [ ] Camera should open
- [ ] Take a photo with numbers visible (e.g., clock showing time)
- [ ] Photo should appear as preview
- [ ] Click "Read Image" button
- [ ] Numbers should be detected and reading generated

### Permission Denial Flow
- [ ] Go to Android Settings → Apps → Vyberology → Permissions
- [ ] Disable Camera permission
- [ ] Return to app and click "Take Photo"
- [ ] Permission denial modal should appear
- [ ] Click "Open Settings" button
- [ ] Should navigate to app settings
- [ ] Re-enable Camera permission
- [ ] Return to app and try again

### Photo Library Access
- [ ] Click "Choose Image" button
- [ ] Photo picker should open
- [ ] Select an image with numbers
- [ ] Image should load as preview
- [ ] Click "Read Image" to process

### Manual Number Entry
- [ ] Click "Manual Entry" tab
- [ ] Type some numbers (e.g., "11:11", "222")
- [ ] Click "Generate Reading"
- [ ] Reading should be generated

### Time Capture
- [ ] Check the large time display
- [ ] Click the "What's the Vybe" button
- [ ] Reading for current time should be generated

---

## Troubleshooting

### Build Errors

**Error: "ANDROID_HOME not set"**
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Error: "No connected devices"**
- Check USB cable connection
- Enable USB Debugging in Developer Options
- Accept USB debugging prompt on phone
- Run: `adb devices` to verify connection

**Error: "Gradle sync failed"**
- Open Android Studio
- File → Invalidate Caches and Restart
- Wait for re-sync

### Runtime Issues

**Camera not opening:**
- Check permissions in Settings → Apps → Vyberology → Permissions
- Verify AndroidManifest.xml has camera permissions
- Try reinstalling the app

**Photos not detected:**
- Ensure image has clear, visible numbers
- Try photos with:
  - Digital clock displays (11:11)
  - Repeating numbers (222, 333)
  - Times from screenshots

**Network requests failing:**
- Check internet connection
- Verify Supabase URL is accessible
- Check Developer Console in Chrome DevTools

---

## Hot Reload During Development

For faster iteration:

1. **Keep dev server running:**
   ```bash
   npm run dev
   ```

2. **Update capacitor.config.ts with your local IP:**
   ```typescript
   const config: CapacitorConfig = {
     server: {
       url: 'http://192.168.0.24:8080',
       cleartext: true
     }
   };
   ```

3. **Rebuild and sync:**
   ```bash
   npx cap sync android
   ```

4. **Now changes to your code will hot-reload on the device!**

---

## Viewing Logs

### Android Logcat (in Android Studio):
- View → Tool Windows → Logcat
- Filter by package name: `app.lovable`

### Chrome DevTools (for web debugging):
- On computer: Open Chrome
- Go to: `chrome://inspect`
- Click "inspect" under your device
- Full Chrome DevTools available!

---

## Next Steps

After testing on Android, consider:

1. **Test on iOS** (requires Mac with Xcode)
2. **Build release APK** for distribution
3. **Deploy to Google Play Store**
4. **Add app icons and splash screens**

---

## Quick Reference Commands

```bash
# Build and sync
npm run build && npx cap sync android

# Open in Android Studio
npx cap open android

# Run directly from CLI
npx cap run android

# View connected devices
adb devices

# View app logs
adb logcat | grep "Capacitor"

# Uninstall app
adb uninstall app.lovable.eebd950946e542d89b5f15154caa7b65

# Install APK
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

**Happy Testing! 📱🎉**
