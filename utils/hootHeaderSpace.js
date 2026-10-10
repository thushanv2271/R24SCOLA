import { useSyncExternalStore } from "react";

// The free strip of the current screen's header (between the logo and the
// icon buttons) where the pet is allowed to live. Each ScreenHeader publishes
// its own while its screen is focused; the newest one wins.
let space = null;
const listeners = new Set();

export const publishHeaderSpace = (next) => {
  if (
    space &&
    Math.abs(space.x - next.x) < 1 &&
    Math.abs(space.y - next.y) < 1 &&
    Math.abs(space.w - next.w) < 1 &&
    Math.abs(space.h - next.h) < 1
  ) {
    return;
  }
  space = next;
  listeners.forEach((fn) => fn());
};

export const useHeaderSpace = () =>
  useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => space,
  );
