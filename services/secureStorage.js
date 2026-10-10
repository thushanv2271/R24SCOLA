/**
 * Storage for genuinely sensitive values (auth token, remembered password) —
 * backed by the OS keychain/keystore via expo-secure-store, instead of
 * AsyncStorage's plain unencrypted files/SharedPreferences. expo-secure-store
 * has no web implementation, so this falls back to AsyncStorage there (web
 * has no equivalent OS-level secure storage available to a plain SPA either
 * way — this keeps existing web behavior rather than breaking it).
 */
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const isSecureStoreAvailable = Platform.OS !== "web";

export const secureSetItem = async (key, value) => {
  if (isSecureStoreAvailable) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
};

export const secureGetItem = async (key) => {
  if (isSecureStoreAvailable) {
    return SecureStore.getItemAsync(key);
  }
  return AsyncStorage.getItem(key);
};

export const secureRemoveItem = async (key) => {
  if (isSecureStoreAvailable) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
};
