import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requireOptionalNativeModule } from "expo";

// App-wide sound effects + haptics. Both are on by default and can be switched
// off in Profile. Sounds follow the device: on iOS the ring/silent switch mutes
// them, and they mix with (never stop) music from other apps.

const KEY = "@feedback_prefs";

const SOURCES = {
  refresh: require("../assets/sounds/refresh.wav"),
  send: require("../assets/sounds/send.wav"),
  receive: require("../assets/sounds/receive.wav"),
  success: require("../assets/sounds/success.wav"),
  error: require("../assets/sounds/error.wav"),
  favorite: require("../assets/sounds/favorite.wav"),
  coins: require("../assets/sounds/coin-count.wav"),
};

let prefs = { sound: true, haptics: true };
const listeners = new Set();
const emit = () => {
  prefs = { ...prefs };
  listeners.forEach((fn) => fn());
};

AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (!raw) return;
    const saved = JSON.parse(raw);
    prefs = { sound: saved.sound !== false, haptics: saved.haptics !== false };
    emit();
  })
  .catch(() => {});

export const getFeedbackPrefs = () => prefs;
export const isHapticsEnabled = () => prefs.haptics;

export const setFeedbackPref = (key, value) => {
  prefs = { ...prefs, [key]: !!value };
  AsyncStorage.setItem(KEY, JSON.stringify(prefs)).catch(() => {});
  emit();
};

export const useFeedbackPrefs = () =>
  useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => prefs,
  );

let audio = null;
let audioChecked = false;
const players = {};

const loadAudio = () => {
  if (audioChecked) return audio;
  audioChecked = true;
  try {
    // Builds made before expo-audio was added simply play no sound.
    if (requireOptionalNativeModule("ExpoAudio")) {
      audio = require("expo-audio");
      audio
        .setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers", shouldPlayInBackground: false })
        .catch(() => {});
    }
  } catch {
    audio = null;
  }
  return audio;
};

export const playSound = (name) => {
  if (!prefs.sound || !SOURCES[name]) return;
  try {
    const mod = loadAudio();
    if (!mod) return;
    if (!players[name]) {
      players[name] = mod.createAudioPlayer(SOURCES[name]);
      players[name].volume = 0.55;
    }
    const player = players[name];
    player.seekTo(0)?.catch?.(() => {});
    player.play();
  } catch {
    // Sound is a nicety; never let it break an action.
  }
};

export const stopSound = (name) => {
  try {
    players[name]?.pause();
  } catch {}
};
