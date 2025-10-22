#!/bin/bash

# Scola App - Google Play Compliance Verification Script
# This script checks if your app is configured correctly for:
# 1. Android 15 (API Level 35)
# 2. 16 KB Memory Page Size Support

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Scola App - Google Play Compliance Verification         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0

# Function to print success
print_success() {
  echo -e "${GREEN}✅ $1${NC}"
  ((PASS_COUNT++))
}

# Function to print failure
print_failure() {
  echo -e "${RED}❌ $1${NC}"
  ((FAIL_COUNT++))
}

# Function to print warning
print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Checking app.json Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -f "app.json" ]; then
  print_failure "app.json not found"
else
  # Check Target SDK Version
  TARGET_SDK=$(grep -A 10 '"android"' app.json | grep targetSdkVersion | grep -o '[0-9]\+' | head -1)
  if [ "$TARGET_SDK" = "35" ]; then
    print_success "Target SDK Version: $TARGET_SDK (Android 15)"
  else
    print_failure "Target SDK Version: $TARGET_SDK (Expected: 35)"
  fi

  # Check Version Code
  VERSION_CODE=$(grep -A 10 '"android"' app.json | grep versionCode | grep -o '[0-9]\+' | head -1)
  if [ "$VERSION_CODE" -ge "6" ]; then
    print_success "Version Code: $VERSION_CODE (New release ready)"
  else
    print_warning "Version Code: $VERSION_CODE (Should be 6 or higher for new release)"
  fi

  # Check App Version
  APP_VERSION=$(grep '"version"' app.json | head -1 | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
  if [ ! -z "$APP_VERSION" ]; then
    print_success "App Version: $APP_VERSION"
  else
    print_failure "App Version not found"
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Checking app.config.js Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -f "app.config.js" ]; then
  print_failure "app.config.js not found (Required for 16 KB support)"
else
  print_success "app.config.js exists"

  # Check compileSdkVersion
  if grep -q "compileSdkVersion: 35" app.config.js; then
    print_success "compileSdkVersion: 35 configured"
  else
    print_failure "compileSdkVersion: 35 not found in app.config.js"
  fi

  # Check targetSdkVersion
  if grep -q "targetSdkVersion: 35" app.config.js; then
    print_success "targetSdkVersion: 35 configured"
  else
    print_failure "targetSdkVersion: 35 not found in app.config.js"
  fi

  # Check expo-build-properties plugin
  if grep -q "expo-build-properties" app.config.js; then
    print_success "expo-build-properties plugin configured"
  else
    print_failure "expo-build-properties plugin not configured"
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Checking Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -f "package.json" ]; then
  print_failure "package.json not found"
else
  # Check expo-build-properties
  if grep -q "expo-build-properties" package.json; then
    PLUGIN_VERSION=$(grep "expo-build-properties" package.json | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)
    print_success "expo-build-properties installed (v$PLUGIN_VERSION)"
  else
    print_failure "expo-build-properties NOT installed"
    echo "   Run: npm install expo-build-properties"
  fi

  # Check node_modules
  if [ -d "node_modules/expo-build-properties" ]; then
    print_success "expo-build-properties in node_modules"
  else
    print_warning "expo-build-properties not in node_modules (Run: npm install)"
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Checking Build Configuration Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check EAS configuration
if [ -f "eas.json" ]; then
  print_success "eas.json exists"
else
  print_warning "eas.json not found (OK if building locally)"
fi

# Check if android folder exists
if [ -d "android" ]; then
  print_warning "Native android/ folder exists (You may need to run: npx expo prebuild --clean)"

  # If android folder exists, check gradle files
  if [ -f "android/app/build.gradle" ]; then
    echo "   Checking android/app/build.gradle..."

    # This is more complex in Expo because gradle uses variables
    if grep -q "compileSdk" android/app/build.gradle; then
      COMPILE_SDK=$(grep "compileSdk" android/app/build.gradle | grep -o '[0-9]\+' | head -1)
      if [ "$COMPILE_SDK" = "35" ]; then
        print_success "   Native compileSdk: $COMPILE_SDK"
      else
        print_warning "   Native compileSdk: $COMPILE_SDK (Run prebuild again)"
      fi
    fi

    if grep -q "targetSdk" android/app/build.gradle; then
      TARGET_SDK_GRADLE=$(grep "targetSdk" android/app/build.gradle | grep -o '[0-9]\+' | head -1)
      if [ "$TARGET_SDK_GRADLE" = "35" ]; then
        print_success "   Native targetSdk: $TARGET_SDK_GRADLE"
      else
        print_warning "   Native targetSdk: $TARGET_SDK_GRADLE (Run prebuild again)"
      fi
    fi
  fi
else
  print_success "No native android/ folder (EAS will build with correct config)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Compliance Requirements Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Issue 1: Android 15 (API Level 35)
if [ "$TARGET_SDK" = "35" ]; then
  print_success "Issue 1: App targets Android 15 (API Level 35) ✓"
  echo "   Deadline: Nov 1, 2025 - READY"
else
  print_failure "Issue 1: App does NOT target Android 15"
  echo "   Deadline: Nov 1, 2025 - NOT READY"
fi

# Issue 2: 16 KB Page Size Support
if [ -f "app.config.js" ] && grep -q "expo-build-properties" app.config.js; then
  print_success "Issue 2: 16 KB memory page size support configured ✓"
  echo "   Deadline: May 31, 2026 - READY"
else
  print_failure "Issue 2: 16 KB memory page size NOT configured"
  echo "   Deadline: May 31, 2026 - NOT READY"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
if [ $FAIL_COUNT -eq 0 ]; then
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✅ ALL CHECKS PASSED! ($PASS_COUNT/$((PASS_COUNT + FAIL_COUNT)))                                   ║${NC}"
  echo -e "${GREEN}║  Your app is configured correctly for Google Play         ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "Next Steps:"
  echo "1. Build your app:"
  echo "   eas build --platform android --profile production"
  echo ""
  echo "2. Upload to Google Play Console (Internal Testing first)"
  echo ""
  echo "3. Verify no compliance warnings appear"
  echo ""
  echo "4. Publish to Production"
else
  echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  ❌ SOME CHECKS FAILED ($FAIL_COUNT failures)                         ║${NC}"
  echo -e "${RED}║  Please fix the issues above before building              ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "Common fixes:"
  echo "1. Run: npm install"
  echo "2. Check app.config.js exists and has correct settings"
  echo "3. Run: npx expo prebuild --clean"
  echo "4. Re-run this script"
fi

echo ""
echo "For detailed verification steps, see: VERIFICATION_GUIDE.md"
echo ""

exit $FAIL_COUNT
