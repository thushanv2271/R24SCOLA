import storageCache from "./storageCache";
import { scholarshipAPI } from "./apiService";
import { normalizeListings } from "../constants/categories";

const CACHE_KEY = "scholarships_all";
const MEMORY_TTL_MS = 5 * 60 * 1000;

let normalized = null;
let normalizedAt = 0;
let inflight = null;
const byKind = new Map();

// One download and one normalization pass for the whole collection, shared by
// Universities, Jobs and Top picks. Callers get the same array instance back
// until the data is refreshed, so React can skip work that depends on it.
export const loadListings = async ({ force = false } = {}) => {
  if (!force && normalized && Date.now() - normalizedAt < MEMORY_TTL_MS) return normalized;
  if (inflight) return inflight;

  inflight = (async () => {
    if (force) await storageCache.clear(CACHE_KEY);
    const raw = await storageCache.getOrFetch(CACHE_KEY, scholarshipAPI.getAllScholarships);
    normalized = normalizeListings(raw);
    normalizedAt = Date.now();
    byKind.clear();
    return normalized;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
};

export const loadListingsOfKind = async (kind, options) => {
  const all = await loadListings(options);
  if (!byKind.has(kind)) byKind.set(kind, all.filter((item) => item.listingKind === kind));
  return byKind.get(kind);
};
