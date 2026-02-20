# 16 KB Memory Page Size Support - Setup Guide

## Overview

This guide explains how to build and deploy your Scola app with Android 15+ (API 35) 16 KB memory page size support for Google Play.

## What's Changed

1. ✅ `app.json` - Updated with `compileSdkVersion: 35` and `minSdkVersion: 24`
2. ✅ `eas.json` - Configured for proper Android bundle release builds
3. ✅ `gradle.properties` - NDK version and build settings for 16 KB support

## Prerequisites

- EAS CLI version 14.2.0 or higher
- Expo SDK 52+
- Node.js and npm installed

## Build Steps

### Step 1: Install/Update EAS CLI

```bash
npm install -g eas-cli@latest
```

### Step 2: Authenticate with EAS

```bash
eas login
```

### Step 3: Build for Production (with 16 KB support)

```bash
eas build --platform android --profile release
```

This will:

- Use NDK version 27.0.12158134 (which supports 16 KB page sizes)
- Build with `targetSdkVersion: 35` (Android 15+)
- Generate an App Bundle (.aab) for Google Play

### Step 4: Submit to Google Play (Optional)

```bash
eas submit --platform android --latest
```

## Verification

After building, you can verify 16 KB support:

1. Navigate to Google Play Console
2. Go to Release → App Bundles and APKs
3. Select your new build
4. Check "Configuration support" section
5. Verify that "16-KB page size" shows as supported

## Key Configuration Changes Explained

### app.json

```json
{
  "android": {
    "compileSdkVersion": 35, // Compile against Android 15
    "targetSdkVersion": 35, // Target Android 15 behavior
    "minSdkVersion": 24 // Support from Android 7.0+
  }
}
```

### eas.json

- `gradleCommand: ":app:bundleRelease"` - Creates App Bundle for Play Store
- `image: "latest"` - Uses latest EAS build images with NDK r27+

### gradle.properties

- `android.ndkVersion=27.0.12158134` - NDK r27 includes 16 KB page size support by default

## Troubleshooting

### Build Fails with NDK Error

- Ensure NDK version is r27 or higher
- Clear EAS build cache: `eas build --platform android --clear`

### Still Getting 16 KB Warning

- Wait 24-48 hours for Google Play to process the new build
- Verify the build was uploaded correctly by checking Google Play Console

### Version Code Conflict

- The `versionCode` will auto-increment (already enabled in eas.json)
- Current: 6 → Next build will be 7

## Next Steps

1. Run `eas build --platform android --profile release`
2. Wait for the build to complete (~10-15 minutes)
3. Upload to Google Play Console
4. Verify 16 KB support is shown in the configuration details

## Additional Resources

- [Expo Android Configuration](https://docs.expo.dev/build-reference/android-config/)
- [Google Play 16 KB Support](https://developer.android.com/guide/practices/page-sizes)
- [EAS Build Documentation](https://docs.expo.dev/build/setup/)
