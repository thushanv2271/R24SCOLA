import { useSyncExternalStore } from "react";

// Whether the "Ask Hoot" chat sheet and the "Customize" sheet are open. Shared
// so the pet, Home and Profile can all open them. `ask` is a question to send
// as soon as the chat opens (from Home's quick questions).
let state = { open: false, customize: false, ask: null };
const listeners = new Set();
const set = (next) => {
  state = { ...state, ...next };
  listeners.forEach((fn) => fn());
};

export const openHootChat = (ask) => {
  const pending = ask && typeof ask.query === "string" ? { query: ask.query, label: ask.label } : null;
  if (!state.open) set({ open: true, ask: pending });
};

export const takeHootAsk = () => {
  const pending = state.ask;
  if (pending) state = { ...state, ask: null };
  return pending;
};

export const closeHootChat = () => {
  if (state.open) set({ open: false });
};

export const openHootCustomize = () => {
  if (!state.customize) set({ customize: true });
};

export const closeHootCustomize = () => {
  if (state.customize) set({ customize: false });
};

export const useHootChat = () =>
  useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => state,
  );
