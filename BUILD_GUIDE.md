# Google Play Store Compliance - Build Guide

## Issues Fixed

### 1. Target Android 15 (API Level 35)
- **Status**: ✅ Fixed
- **Change**: Updated `targetSdkVersion` to 35 in app.json and app.config.js

### 2. 16 KB Memory Page Size Support
- **Status**: ✅ Fixed
- **Changes**:
  - Installed `expo-build-properties` plugin
  - Configured Android build settings for 16 KB page alignment
  - Updated `compileSdkVersion` and `buildToolsVersion`

## Version Updates

- **App Version**: 2.3.0 → 2.4.0
- **Version Code**: 5 → 6

## Build Instructions

### Prerequisites

1. Ensure you have EAS CLI installed:
   ```bash
   npm install -g eas-cli
   ```

2. Login to your Expo account:
   ```bash
   eas login
   ```

### Step 1: Clean Install Dependencies

```bash
# Remove node_modules and package-lock
rm -rf node_modules package-lock.json

# Clean install
npm install
```

### Step 2: Prebuild (Optional - for testing)

If you want to inspect the native Android configuration:

```bash
npx expo prebuild --clean
```

This will generate the `android/` folder where you can verify the gradle configurations.

### Step 3: Build for Production

Build the Android App Bundle (AAB) for Google Play Store:

```bash
eas build --platform android --profile production
```

**Important Notes:**
- The build will run on EAS servers
- It will automatically use the configuration from `app.config.js`
- The build will include Android 15 (API 35) target and 16 KB page size support
- Build time: approximately 10-20 minutes

### Step 4: Download the Build

After the build completes:

1. EAS will provide a download link
2. Download the `.aab` file to your local machine
3. The file will be named something like: `build-[timestamp].aab`

### Step 5: Test the Build (Recommended)

Before uploading to production, test using internal testing:

1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to: Testing → Internal testing
3. Create a new release
4. Upload your `.aab` file
5. Add release notes
6. Review and rollout to internal testers
7. Verify that no errors appear about API level or 16 KB support

### Step 6: Upload to Production

Once testing is successful:

1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to: Production → Create new release
3. Upload your `.aab` file
4. Add release notes (example below)
5. Review the release
6. Click "Start rollout to production"

**Example Release Notes:**
```
Version 2.4.0

Technical Updates:
- Updated to target Android 15 (API Level 35) for latest Android compatibility
- Added support for 16 KB memory page sizes
- Performance improvements and stability enhancements

This update ensures full compliance with Google Play's latest requirements.
```

### Step 7: Verify Compliance

After uploading:

1. Wait 1-2 hours for Google Play to process the build
2. Check your Google Play Console inbox
3. You should receive a confirmation that:
   - ✅ App targets Android 15 (API Level 35)
   - ✅ App supports 16 KB memory page sizes
4. The compliance warnings should disappear

## Alternative: Build Locally (Advanced)

If you prefer to build locally:

1. Prebuild native directories:
   ```bash
   npx expo prebuild --clean
   ```

2. Build the Android App Bundle:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

3. The AAB will be located at:
   ```
   android/app/build/outputs/bundle/release/app-release.aab
   ```

## Troubleshooting

### Issue: "Build failed - dependencies not compatible with 16 KB"

**Solution**: Check all native dependencies are up to date:
```bash
npm update
npx expo install --fix
```

### Issue: "targetSdkVersion not applied"

**Solution**: Make sure to use `app.config.js` instead of `app.json` as it takes precedence:
```bash
# Remove app.json to avoid conflicts (optional)
# or rename it to app.json.backup
```

### Issue: "Version code already exists"

**Solution**: Increment the version code in both files:
- `app.json` line 19: `"versionCode": 7`
- `app.config.js` line 18: `versionCode: 7`

## Configuration Files Changed

1. **app.config.js** (NEW)
   - Complete Expo configuration with Android 15 support
   - 16 KB page size configuration via expo-build-properties

2. **app.json**
   - Version: 2.4.0
   - Version Code: 6
   - Target SDK: 35

3. **package.json**
   - Added: expo-build-properties@^1.0.9

## Support Links

- [Google Play Target API Requirements](https://support.google.com/googleplay/android-developer/answer/11926878)
- [16 KB Page Size Support Guide](https://developer.android.com/guide/practices/page-sizes)
- [Expo Build Properties](https://docs.expo.dev/versions/latest/sdk/build-properties/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

## Timeline

- **Deadline for API 35**: November 1, 2025
- **Deadline for 16 KB Support**: May 31, 2026
- **Recommended**: Upload new build within 7 days

## Next Steps

1. ✅ Review this guide
2. ⏳ Run the production build: `eas build --platform android --profile production`
3. ⏳ Test with internal testing track
4. ⏳ Upload to production
5. ⏳ Verify compliance in Google Play Console

---

**Need Help?**
- Check EAS Build logs for detailed error messages
- Review the Google Play Console for specific compliance issues
- Ensure all dependencies are compatible with Android 15
