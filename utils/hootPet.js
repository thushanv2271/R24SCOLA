import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GUIDE_PHASES } from "./setupGuide";
import { useGuideProgress } from "./guideProgress";

// Which character the user picked, and how far the pet has grown. Growth is
// simply the number of the eight setup tasks finished.
export const CHARACTERS = ["owl", "fox", "penguin"];
export const STAGE_AT = [0, 2, 4, 6, 8];
const CHAR_KEY = "@scola_pet_char";
const SEEN_KEY = "@scola_pet_grown";

let character = "owl";
const listeners = new Set();
const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

AsyncStorage.getItem(CHAR_KEY)
  .then((v) => {
    if (CHARACTERS.includes(v) && v !== character) {
      character = v;
      listeners.forEach((fn) => fn());
    }
  })
  .catch(() => {});

export const setHootCharacter = (next) => {
  if (!CHARACTERS.includes(next) || next === character) return;
  character = next;
  listeners.forEach((fn) => fn());
  AsyncStorage.setItem(CHAR_KEY, next).catch(() => {});
};

export const useHootCharacter = () => useSyncExternalStore(subscribe, () => character);

export const stageForDone = (done) => STAGE_AT.reduce((stage, at, i) => (done >= at ? i : stage), 0);

export const useHootGrowth = () => {
  const { remaining } = useGuideProgress();
  const total = GUIDE_PHASES.length;
  const done = total - remaining;
  const stage = stageForDone(done);
  const nextAt = STAGE_AT[stage + 1] ?? null;
  return { done, total, stage, nextAt, toNext: nextAt == null ? 0 : nextAt - done };
};

// The highest task count the pet has already celebrated, so each step of
// growth is cheered once. null until the first launch records a baseline.
let celebrated;
export const getCelebrated = async () => {
  if (celebrated !== undefined) return celebrated;
  try {
    const raw = await AsyncStorage.getItem(SEEN_KEY);
    celebrated = raw == null ? null : Number(raw);
  } catch {
    celebrated = null;
  }
  return celebrated;
};

export const setCelebrated = (n) => {
  celebrated = n;
  AsyncStorage.setItem(SEEN_KEY, String(n)).catch(() => {});
};
