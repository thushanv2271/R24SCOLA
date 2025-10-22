# Verification Guide - How to Check Changes Worked

## Method 1: Quick Local Check (30 seconds)

### Verify Configuration Files

```bash
# Check that target SDK is 35
grep -A 5 "android" app.json | grep targetSdkVersion

# Check that expo-build-properties is installed
grep "expo-build-properties" package.json

# Check version was updated
grep "version" app.json | head -2
```

**Expected Output:**
- `"targetSdkVersion": 35`
- `"expo-build-properties": "^[version]"`
- `"version": "2.4.0"`
- `"versionCode": 6`

---

## Method 2: Inspect Native Configuration (5 minutes)

This generates the actual Android project files so you can verify the settings:

```bash
# Generate native Android folder
npx expo prebuild --clean

# Check the generated gradle file
cat android/app/build.gradle | grep -E "compileSdk|targetSdk|minSdk"
```

**Expected Output:**
```groovy
compileSdk = 35
targetSdk = 35
minSdk = 23 (or higher)
```

**Also check:**
```bash
# Verify build tools version
cat android/build.gradle | grep buildToolsVersion
```

---

## Method 3: Build and Analyze AAB (15-20 minutes)

This is the most reliable way to verify before uploading to Play Store.

### Step 1: Build the App

```bash
# Using EAS Build (recommended)
eas build --platform android --profile production

# OR build locally
npx expo prebuild --clean
cd android
./gradlew bundleRelease
```

### Step 2: Analyze the Bundle

After the build completes, use bundletool to inspect:

```bash
# Install bundletool (if not already installed)
# Download from: https://github.com/google/bundletool/releases

# For EAS build - download the .aab file first
# For local build - it's at: android/app/build/outputs/bundle/release/app-release.aab

# Check bundle info
java -jar bundletool-all.jar dump manifest --bundle=path/to/your.aab | grep -E "targetSdkVersion|compileSdkVersion"
```

**Expected Output:**
```xml
android:targetSdkVersion='35'
android:compileSdkVersion='35'
```

### Step 3: Check for 16 KB Support

```bash
# Verify native libraries are properly aligned
java -jar bundletool-all.jar validate --bundle=path/to/your.aab

# This should complete without errors about page sizes
```

---

## Method 4: Google Play Console Pre-Upload Check (BEST - 5 minutes)

This is the most accurate way to verify compliance BEFORE going to production.

### Step 1: Upload to Internal Testing

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app "Scola"
3. Navigate to: **Testing → Internal testing**
4. Click "Create new release"
5. Upload your `.aab` file
6. Click "Review release" (don't publish yet)

### Step 2: Check for Warnings

**Look for these specific checks:**

✅ **Target API Level Check:**
- Should say: "Targets API level 35 (Android 15)"
- Should NOT show warning: "App must target Android 15"

✅ **16 KB Page Size Check:**
- Should NOT show warning: "App does not support 16 KB page sizes"
- In "Bundle details" section, it should show compatibility

### Step 3: Save as Draft or Publish to Internal

You can either:
- Save as draft to see the warnings/errors
- Publish to internal testers to fully verify

---

## Method 5: Use Google's App Bundle Explorer (10 minutes)

After uploading to any track (including internal testing):

1. Go to Google Play Console
2. Navigate to: **Release → App bundle explorer**
3. Select your latest upload
4. Click on **"Details"** tab

**Check these sections:**

### Target API Level
```
API level: 35 (Android 15)
Status: ✅ Compliant
```

### Device Compatibility
- Should show compatibility with devices using 16 KB page sizes
- No warnings about memory page size incompatibility

### APK Details
- Download an APK and check manifest:
```bash
# Extract APK from bundle
java -jar bundletool-all.jar build-apks \
  --bundle=your.aab \
  --output=output.apks \
  --mode=universal

# Unzip and check manifest
unzip output.apks -d apks/
aapt dump badging apks/universal.apk | grep -E "targetSdkVersion|platformBuildVersionCode"
```

**Expected:**
```
targetSdkVersion:'35'
platformBuildVersionCode='35'
```

---

## Method 6: Android Studio Verification (Advanced)

### Step 1: Open in Android Studio

```bash
# Generate native project
npx expo prebuild --clean

# Open android/ folder in Android Studio
```

### Step 2: Check Build Configuration

1. Open `File → Project Structure`
2. Go to `Modules → app`
3. Check:
   - **Compile SDK Version**: 35
   - **Target SDK Version**: 35
   - **Build Tools Version**: 35.0.0

### Step 3: Build and Analyze APK

1. In Android Studio: `Build → Build Bundle(s) / APK(s) → Build Bundle(s)`
2. After build: `Build → Analyze APK`
3. Check the manifest for targetSdkVersion

---

## Method 7: Production Upload Test (FINAL - 30 minutes)

The ultimate verification - upload to production as a draft:

### Step 1: Create Production Release (Don't Publish)

1. Go to **Production → Create new release**
2. Upload your `.aab` file
3. Add release notes
4. Click **"Review release"** (DO NOT click "Start rollout")

### Step 2: Check for Errors/Warnings

Google Play will analyze your bundle and show:

**✅ What you WANT to see:**
- No errors or warnings
- "This release targets API level 35"
- No warnings about 16 KB page sizes
- Green checkmark on all compliance items

**❌ What you DON'T want to see:**
- "App must target Android 15 (API level 35)"
- "App does not support 16 KB memory page sizes"
- Red or orange warning icons

### Step 3: Verify Compliance Dashboard

1. Go to **Policy → App content**
2. Check "Target API level" section
3. Should show: ✅ "Your app targets API level 35"

---

## Quick Verification Checklist

Use this checklist to verify everything:

### Configuration Files
- [ ] `app.json` has `"targetSdkVersion": 35`
- [ ] `app.json` has `"versionCode": 6` (or higher)
- [ ] `app.config.js` exists with expo-build-properties configuration
- [ ] `package.json` includes expo-build-properties

### Build Verification
- [ ] Build completes without errors
- [ ] AAB file is generated
- [ ] Bundletool validation passes
- [ ] Manifest shows targetSdkVersion='35'

### Google Play Console
- [ ] Upload to internal testing succeeds
- [ ] No API level warnings
- [ ] No 16 KB page size warnings
- [ ] App bundle explorer shows API 35
- [ ] Compliance dashboard shows green checkmarks

---

## Automated Verification Script

I'll create a script to run all local checks:

```bash
#!/bin/bash

echo "=== Scola App Compliance Verification ==="
echo ""

echo "1. Checking app.json configuration..."
TARGET_SDK=$(grep -A 5 '"android"' app.json | grep targetSdkVersion | grep -o '[0-9]\+')
VERSION_CODE=$(grep -A 5 '"android"' app.json | grep versionCode | grep -o '[0-9]\+')
APP_VERSION=$(grep '"version"' app.json | head -1 | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')

if [ "$TARGET_SDK" = "35" ]; then
  echo "✅ Target SDK: $TARGET_SDK (Android 15)"
else
  echo "❌ Target SDK: $TARGET_SDK (Expected: 35)"
fi

echo "✅ App Version: $APP_VERSION"
echo "✅ Version Code: $VERSION_CODE"
echo ""

echo "2. Checking dependencies..."
if grep -q "expo-build-properties" package.json; then
  echo "✅ expo-build-properties is installed"
else
  echo "❌ expo-build-properties is NOT installed"
fi
echo ""

echo "3. Checking app.config.js..."
if [ -f "app.config.js" ]; then
  echo "✅ app.config.js exists"
  if grep -q "compileSdkVersion: 35" app.config.js; then
    echo "✅ compileSdkVersion is set to 35"
  fi
  if grep -q "targetSdkVersion: 35" app.config.js; then
    echo "✅ targetSdkVersion is set to 35"
  fi
else
  echo "❌ app.config.js does NOT exist"
fi
echo ""

echo "=== Summary ==="
echo "Configuration looks good! ✅"
echo ""
echo "Next steps:"
echo "1. Build the app: eas build --platform android --profile production"
echo "2. Upload to Google Play Console Internal Testing"
echo "3. Verify no compliance warnings appear"
echo ""
```

Save this as `verify-compliance.sh` and run:
```bash
chmod +x verify-compliance.sh
./verify-compliance.sh
```

---

## Expected Timeline for Full Verification

1. **Local checks**: 2 minutes
2. **Build app**: 15-20 minutes (EAS) or 5-10 minutes (local)
3. **Upload to Play Console**: 5 minutes
4. **Google processing**: 1-2 hours
5. **Compliance confirmation**: Up to 24 hours

---

## What Success Looks Like

### In Google Play Console Inbox

You should receive an email/inbox message like:

```
✅ Your app update was successful

Your app "Scola" (com.thusha2271.scholarships)
now targets API level 35 (Android 15) and supports
16 KB memory page sizes.

The following issues have been resolved:
• App must target Android 15 (API level 35) or higher
• App must support 16 KB memory page sizes

You can now continue to publish updates to your app.
```

### In Release Dashboard

- **No red/orange warning badges**
- **Compliance section shows all green checkmarks**
- **Warnings from Jul 1, 2025 and Aug 28, 2025 are cleared**

---

## Troubleshooting Failed Verification

### If Google still shows API level warning:

```bash
# Check you're uploading the RIGHT bundle
# Verify the AAB file date is AFTER your changes

ls -lh *.aab  # Check file modification date

# Re-download from EAS and check
eas build:list
```

### If 16 KB warning persists:

```bash
# Ensure expo-build-properties is in dependencies, not devDependencies
cat package.json | grep -A 2 '"dependencies"' | grep expo-build-properties

# Rebuild with --clear-cache
eas build --platform android --profile production --clear-cache
```

### If build fails:

```bash
# Clean everything and rebuild
rm -rf node_modules package-lock.json
npm install
npx expo prebuild --clean
```

---

## Need Help?

If verification fails, check:
1. EAS build logs for errors
2. Google Play Console "Pre-launch report"
3. Bundle analyzer output
4. Compare your AAB with the verification checklist above

**Remember:** The most reliable verification is uploading to Google Play Console (even just Internal Testing) and checking for warnings there.
