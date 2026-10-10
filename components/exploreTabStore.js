import { useSyncExternalStore } from "react";

// Which half of Explore is open ("scholarships" = Universities, "jobs").
// Shared so the Explore pager, the tab bar icon and the /Jobs redirect agree.
let current = "scholarships";
const listeners = new Set();

// Which halves the user wants ("both", or just "scholarships" / "jobs"),
// following the interest chosen at onboarding / in Settings. When only one is
// allowed the other can never become current.
let allowed = "both";

export const getExploreTab = () => current;
export const getAllowedExploreTab = () => allowed;

export const setExploreTab = (tab) => {
  if (allowed !== "both" && tab !== allowed) return;
  if (tab === current) return;
  current = tab;
  listeners.forEach((l) => l());
};

export const setAllowedExploreTab = (next) => {
  allowed = next === "scholarships" || next === "jobs" ? next : "both";
  if (allowed !== "both" && current !== allowed) {
    current = allowed;
    listeners.forEach((l) => l());
  }
};

const pendingListeners = new Set();
const notifyPending = () => pendingListeners.forEach((l) => l());

// Lets an Explore that is already on screen pick up a search or category set
// from elsewhere (the owl assistant) without waiting to regain focus.
export const subscribeExplorePending = (l) => {
  pendingListeners.add(l);
  return () => pendingListeners.delete(l);
};

// A search to pre-fill when Explore next gains focus (used by Home's top picks).
let pendingSearch = null;
export const setExploreSearch = (tab, query) => {
  pendingSearch = { tab, query };
  notifyPending();
};
export const takeExploreSearch = () => {
  const pending = pendingSearch;
  pendingSearch = null;
  return pending;
};

// A category (plus optional subcategory / study level) to pre-select when
// Explore next gains focus — set by the category browser.
let pendingCategory = null;
export const setExploreCategory = (tab, category, subcategory = "", level = "") => {
  pendingCategory = { tab, category, subcategory, level };
  notifyPending();
};
export const takeExploreCategory = () => {
  const pending = pendingCategory;
  pendingCategory = null;
  return pending;
};

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useExploreTab = () =>
  useSyncExternalStore(subscribe, getExploreTab, getExploreTab);
