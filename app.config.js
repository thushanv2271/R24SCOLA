module.exports = {
  expo: {
    name: "Scola",
    slug: "scholarships",
    version: "2.4.0",
    icon: "./assets/images/icon.png",
    scheme: "scholarships",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.thusha2271.scholarships",
      versionCode: 6, // Incremented for new release
      targetSdkVersion: 35,
      compileSdkVersion: 35,
      // Configuration for 16 KB page size support
      buildToolsVersion: "35.0.0",
      minSdkVersion: 23,
      config: {
        // Enable 16 KB page size support
        "android.bundle.enableUncompressedNativeLibs": false,
      },
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            // Ensure compatibility with 16 KB page sizes
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: "35.0.0",
            // Enable 16 KB page alignment
            enableProguardInReleaseBuilds: true,
            // This ensures proper memory alignment
            packagingOptions: {
              pickFirst: ["**/libc++_shared.so"],
            },
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      googleClientIdAndroid:
        "165483938092-7j7i7sroo527310ssoca4uq78sstcu1u.apps.googleusercontent.com",
      googleClientIdIos: "YOUR_IOS_CLIENT_ID",
      googleClientIdWeb: "YOUR_WEB_CLIENT_ID",
      eas: {
        projectId: "12cfea4a-1181-4147-a5fb-f43838d91572",
      },
    },
    owner: "thusha2271",
  },
};
