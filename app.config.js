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
      edgeToEdgeEnabled: true,
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
            compileSdkVersion: 36,
            targetSdkVersion: 36,
            buildToolsVersion: "36.0.0",
            minSdkVersion: 23,
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
      googleClientIdAndroid: process.env.GOOGLE_CLIENT_ID_ANDROID,
      googleClientIdIos: process.env.GOOGLE_CLIENT_ID_IOS,
      googleClientIdWeb: process.env.GOOGLE_CLIENT_ID_WEB,
      eas: {
        projectId: "12cfea4a-1181-4147-a5fb-f43838d91572",
      },
    },
    owner: "thusha2271",
  },
};
