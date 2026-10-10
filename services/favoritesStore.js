import { useSyncExternalStore } from "react";

// Single source of truth for the signed-in user's favourites (full listing
// objects, per kind). Every screen that shows a favourite count, a heart or
// the favourites list reads from here, so a toggle shows up everywhere at
// once instead of waiting for each screen to re-fetch from the server.
// `null` means "not loaded yet".
let state = { scholarships: null, jobs: null };
let mutations = 0;
const listeners = new Set();

const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getState = () => state;
const update = (patch) => {
  state = { ...state, ...patch };
  emit();
};

export const favoritesStore = {
  getState,
  // Call before a server fetch and pass the result to setItems: a fetch that
  // started before an optimistic add/remove would otherwise overwrite it.
  mark: () => mutations,
  setItems(kind, items, startedAt) {
    if (startedAt !== undefined && startedAt !== mutations) return;
    update({ [kind]: items });
  },
  add(kind, item) {
    if (!item?.id) return;
    const current = state[kind] || [];
    if (current.some((entry) => entry.id === item.id)) return;
    mutations += 1;
    update({ [kind]: [...current, item] });
  },
  remove(kind, id) {
    const current = state[kind];
    if (!current) return;
    mutations += 1;
    update({ [kind]: current.filter((entry) => entry.id !== id) });
  },
  clear(kind) {
    mutations += 1;
    update({ [kind]: [] });
  },
  reset() {
    mutations += 1;
    update({ scholarships: null, jobs: null });
  },
};

export const useFavorites = () => useSyncExternalStore(subscribe, getState, getState);
