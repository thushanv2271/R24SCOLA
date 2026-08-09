const { withProjectBuildGradle } = require("expo/config-plugins");

// react-native 0.76.x pins ndkVersion to 26.1.10909125 by default, which does
// not produce 16 KB page-aligned native libraries (Google Play requirement).
// expo-build-properties no longer exposes an `ndkVersion` override, so patch
// the generated root build.gradle directly during prebuild.
const NDK_VERSION = "27.1.12297006";

function withNdk16kbSupport(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error(
        "withNdk16kbSupport: root build.gradle is not groovy, cannot patch ndkVersion"
      );
    }
    config.modResults.contents = config.modResults.contents.replace(
      /ndkVersion\s*=\s*["'][\d.]+["']/,
      `ndkVersion = "${NDK_VERSION}"`
    );
    return config;
  });
}

module.exports = withNdk16kbSupport;
