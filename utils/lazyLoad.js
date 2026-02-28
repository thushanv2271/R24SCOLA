/**
 * Lazy Loading Utility for Expo Router
 * Enables on-demand route loading instead of loading all screens at startup
 *
 * Usage:
 * import { lazyLoad } from '@/utils/lazyLoad';
 * const MyScreen = lazyLoad(() => import('@/app/MyScreen'));
 */

import React from "react";
import { ActivityIndicator, View } from "react-native";
import { PRIMARY_BLUE } from "../constants/colors";

const LoadingComponent = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <ActivityIndicator size="large" color={PRIMARY_BLUE} />
  </View>
);

export const lazyLoad = (importFunc) => {
  return React.lazy(importFunc);
};

/**
 * Higher-order component to wrap lazy-loaded components with a fallback UI
 */
export const withLazyLoading = (LazyComponent, LoadingComponent) => {
  return (props) => (
    <React.Suspense fallback={<LoadingComponent />}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

export default lazyLoad;
