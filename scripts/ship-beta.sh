#!/usr/bin/env bash
set -euo pipefail

WEB_DIR="apps/web"
IOS_WORKSPACE="$WEB_DIR/ios/App/App.xcworkspace"
IOS_SCHEME="App"
IOS_ARCHIVE_PATH="$WEB_DIR/build/App.xcarchive"
IOS_EXPORT_DIR="$WEB_DIR/build/export"
IOS_EXPORT_PLIST="$IOS_EXPORT_DIR/ExportOptions.plist"
ANDROID_DIR="$WEB_DIR/android"
DEPLOY_WORKFLOW_NAME="Deploy (Web + Supabase)"
ASC_USERNAME="${ASC_USERNAME:-}"
ASC_APP_SPECIFIC_PASSWORD="${ASC_APP_SPECIFIC_PASSWORD:-}"

banner(){ printf "\n\033[1;36m▶ %s\033[0m\n" "$*"; }
pass(){   printf "\033[1;32m✓ %s\033[0m\n" "$*"; }
warn(){   printf "\033[1;33m! %s\033[0m\n" "$*"; }
fail(){   printf "\033[1;31m✗ %s\033[0m\n" "$*"; exit 1; }
require_cmd(){ command -v "$1" >/dev/null 2>&1 || fail "Missing '$1'"; }

banner "Preflight: tools & repo layout"
require_cmd uname
[[ "$(uname -s)" == "Darwin" ]] || fail "This script is macOS-only."

banner "Checking Xcode install / selection"
if ! xcode-select -p >/dev/null 2>&1; then
  warn "Xcode not initialized. Opening App Store…"
  open "macappstore://itunes.apple.com/app/id497799835" || true
  fail "Install Xcode from App Store, then re-run."
fi

XCODE_PATH=$(xcode-select -p 2>/dev/null || true)
if [[ "$XCODE_PATH" == "/Library/Developer/CommandLineTools" ]]; then
  warn "CLI tools active, switching to full Xcode if present…"
  if [[ -d "/Applications/Xcode.app/Contents/Developer" ]]; then
    sudo xcode-select -s "/Applications/Xcode.app/Contents/Developer"
    pass "Switched xcode-select to /Applications/Xcode.app"
  else
    open "macappstore://itunes.apple.com/app/id497799835" || true
    fail "Full Xcode not found. Install it and re-run."
  fi
fi

sudo xcodebuild -license accept >/dev/null 2>&1 || true
pass "Xcode ready: $(xcodebuild -version | tr '\n' ' ')"

if ! command -v pod >/dev/null 2>&1; then
  banner "Installing CocoaPods…"
  sudo gem install cocoapods || fail "CocoaPods install failed"
  pass "CocoaPods installed"
fi
require_cmd npm
require_cmd npx

banner "Install workspace deps & build web"
npm ci
npm run build --workspace "$WEB_DIR"

if [[ "${NETLIFY:-}" == "true" ]] || [[ "$(uname -s)" == "Darwin" ]]; then
  ( cd "$WEB_DIR" && npm i @rollup/rollup-darwin-x64 -D --no-save >/dev/null 2>&1 || true )
fi
pass "Web build complete"

banner "Capacitor sync (Android/iOS)"
( cd "$WEB_DIR" && npx cap sync android )
pass "Android sync OK"

if ( cd "$WEB_DIR" && npx cap sync ios ); then
  pass "iOS sync OK"
else
  warn "iOS sync reported warnings—continuing"
fi
[[ -d "$IOS_WORKSPACE" || -f "$IOS_WORKSPACE" ]] || fail "iOS workspace missing at $IOS_WORKSPACE. If first run, try: (cd $WEB_DIR && npx cap add ios) then re-run."

banner "iOS: CocoaPods install"
pod install --project-directory="$WEB_DIR/ios/App"
pass "Pods installed"

banner "iOS: archive build"
mkdir -p "$WEB_DIR/build"
xcodebuild \
  -workspace "$IOS_WORKSPACE" \
  -scheme "$IOS_SCHEME" \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$IOS_ARCHIVE_PATH" \
  clean archive \
  | xcpretty || fail "xcodebuild archive failed"
pass "Archive created: $IOS_ARCHIVE_PATH"

banner "iOS: export IPA"
mkdir -p "$IOS_EXPORT_DIR"
cat > "$IOS_EXPORT_PLIST" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>app-store</string>
  <key>uploadSymbols</key><true/>
  <key>compileBitcode</key><false/>
  <key>signingStyle</key><string>automatic</string>
</dict>
</plist>
PLIST

xcodebuild -exportArchive \
  -archivePath "$IOS_ARCHIVE_PATH" \
  -exportPath "$IOS_EXPORT_DIR" \
  -exportOptionsPlist "$IOS_EXPORT_PLIST" \
  | xcpretty || fail "Export IPA failed"

IPA_PATH=$(find "$IOS_EXPORT_DIR" -name "*.ipa" -maxdepth 1 | head -n1)
[[ -f "$IPA_PATH" ]] || fail "No IPA produced in $IOS_EXPORT_DIR"
pass "IPA ready: $IPA_PATH"

if [[ -n "$ASC_USERNAME" && -n "$ASC_APP_SPECIFIC_PASSWORD" ]]; then
  banner "Uploading IPA to TestFlight"
  xcrun altool --upload-app -f "$IPA_PATH" \
    -u "$ASC_USERNAME" -p "$ASC_APP_SPECIFIC_PASSWORD" \
    --output-format xml || fail "altool upload failed"
  pass "Upload submitted to TestFlight"
else
  warn "ASC_USERNAME / ASC_APP_SPECIFIC_PASSWORD not set. Skipping auto-upload."
  echo "Manual upload: open Transporter.app and drop $IPA_PATH"
fi

banner "Android: bundle release"
( cd "$ANDROID_DIR" && ./gradlew bundleRelease ) || warn "Gradle bundle failed—open Android Studio to configure signing."
AAB_PATH=$(find "$ANDROID_DIR" -path "*/build/outputs/bundle/release/*.aab" | head -n1 || true)
if [[ -f "$AAB_PATH" ]]; then
  pass "AAB ready: $AAB_PATH"
  echo "Upload via Play Console → Internal testing."
else
  warn "AAB not found (likely signing not configured); build in Android Studio."
fi

if command -v gh >/dev/null 2>&1; then
  banner "Trigger Deploy workflow (optional)"
  if gh run list --limit 1 >/dev/null 2>&1; then
    gh workflow run "$DEPLOY_WORKFLOW_NAME" || warn "Could not dispatch Deploy workflow"
    pass "Deploy workflow dispatched"
  else
    warn "gh CLI not authenticated; skipping deploy dispatch"
  fi
else
  warn "GitHub CLI not installed; skipping deploy dispatch"
fi

banner "DONE"
echo
echo "iOS archive: $IOS_ARCHIVE_PATH"
echo "IPA:        $IPA_PATH"
echo "Android AAB: $AAB_PATH"
SH

chmod +x scripts/ship-beta.sh
