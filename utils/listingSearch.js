// Search shared by Explore (universities and companies).
//
// Each listing is folded to lowercase, accent-free text once and cached, so a
// keystroke only compares short strings instead of re-lowercasing every field
// of every listing. Words can be typed in any order ("stanford computer"),
// results are ranked by where the match lands (title first), and when nothing
// matches a small typo is forgiven ("hardvard").

const SEPARATORS = /[-/&,.()_]/g;

export const fold = (value) => {
  if (!value) return "";
  let out = String(value).toLowerCase();
  try {
    out = out.normalize("NFD").replace(/[̀-ͯ]/g, "");
  } catch {
    // normalize() unavailable: plain lowercase is still fine.
  }
  return out.replace(SEPARATORS, " ");
};

export const tokenize = (query) => fold(query).split(/\s+/).filter(Boolean);

const wordStart = (text, token) => text.startsWith(token) || text.includes(` ${token}`);

const entries = new WeakMap();

const entryFor = (item) => {
  let entry = entries.get(item);
  if (!entry) {
    const title = fold(item.title);
    const org = fold(item.university);
    const field = fold(`${item.subcategory || ""} ${item.category || ""}`);
    const country = fold(item.country);
    entry = { title, org, field, country, words: null };
    entries.set(item, entry);
  }
  return entry;
};

const wordsOf = (entry) => {
  if (!entry.words) {
    entry.words = `${entry.title} ${entry.org} ${entry.field} ${entry.country}`.split(/\s+/).filter((w) => w.length >= 3);
  }
  return entry.words;
};

// True when a and b differ by at most `max` single-character edits.
export const withinEdits = (a, b, max) => {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      if (row[j] < best) best = row[j];
    }
    if (best > max) return false;
    prev = row;
  }
  return prev[b.length] <= max;
};

const tokenScore = (entry, token, fuzzy) => {
  if (entry.title.startsWith(token)) return 8;
  if (wordStart(entry.title, token)) return 6;
  if (wordStart(entry.org, token)) return 5;
  if (entry.title.includes(token)) return 4;
  if (entry.org.includes(token)) return 3;
  if (wordStart(entry.field, token)) return 3;
  if (entry.field.includes(token)) return 2;
  if (wordStart(entry.country, token)) return 2;
  if (entry.country.includes(token)) return 1;
  if (fuzzy && token.length >= 4) {
    const max = token.length >= 8 ? 2 : 1;
    if (wordsOf(entry).some((w) => w[0] === token[0] && withinEdits(w, token, max))) return 1;
  }
  return 0;
};

const scoreItem = (item, tokens, phrase, fuzzy) => {
  const entry = entryFor(item);
  let total = 0;
  for (const token of tokens) {
    const s = tokenScore(entry, token, fuzzy);
    if (!s) return 0;
    total += s;
  }
  if (tokens.length > 1 && entry.title.includes(phrase)) total += 5;
  if (entry.title === phrase) total += 10;
  return total;
};

// Filters `items` by `query` and (unless rank is false) orders the best
// matches first. Returns the same array when the query is empty.
export const searchListings = (items, query, { rank = true } = {}) => {
  const tokens = tokenize(query);
  if (!tokens.length) return items;
  const phrase = tokens.join(" ");

  const run = (fuzzy) => {
    const hits = [];
    items.forEach((item, index) => {
      const score = scoreItem(item, tokens, phrase, fuzzy);
      if (score > 0) hits.push({ item, score, index });
    });
    return hits;
  };

  let hits = run(false);
  if (!hits.length && tokens.some((t) => t.length >= 4)) hits = run(true);
  if (rank) hits.sort((a, b) => b.score - a.score || a.index - b.index);
  return hits.map((h) => h.item);
};

const candidateCache = new WeakMap();

const candidatesFor = (items, sources) => {
  const key = sources.map(([field, type]) => `${field}:${type}`).join("|");
  let perItems = candidateCache.get(items);
  if (!perItems) {
    perItems = new Map();
    candidateCache.set(items, perItems);
  }
  let list = perItems.get(key);
  if (!list) {
    const seen = new Set();
    list = [];
    items.forEach((item) => {
      sources.forEach(([field, type], priority) => {
        const value = item[field];
        if (!value || typeof value !== "string") return;
        const folded = fold(value);
        const id = `${type}:${folded}`;
        if (seen.has(id)) return;
        seen.add(id);
        list.push({ value, type, folded, priority });
      });
    });
    perItems.set(key, list);
  }
  return list;
};

// Up to `limit` distinct names (universities, subjects, countries ...) that
// match what has been typed. `sources` is [[itemField, label], ...].
export const buildSuggestions = (items, query, sources, limit = 6) => {
  const tokens = tokenize(query);
  const phrase = tokens.join(" ");
  if (phrase.length < 2) return [];
  const scored = [];
  candidatesFor(items, sources).forEach((c) => {
    if (!tokens.every((t) => c.folded.includes(t))) return;
    const rank = c.folded.startsWith(phrase) ? 0 : tokens.every((t) => wordStart(c.folded, t)) ? 1 : 2;
    scored.push({ c, rank });
  });
  scored.sort(
    (a, b) =>
      a.rank - b.rank ||
      a.c.priority - b.c.priority ||
      a.c.value.length - b.c.value.length ||
      a.c.value.localeCompare(b.c.value),
  );
  return scored.slice(0, limit).map(({ c }) => ({ value: c.value, type: c.type }));
};

// [start, end) of the part of `text` that matches the query, for bolding.
export const matchRange = (text, query) => {
  if (!text || !query) return null;
  const folded = fold(text);
  if (folded.length !== text.length) return null;
  const tokens = tokenize(query);
  if (!tokens.length) return null;
  const phrase = tokens.join(" ");
  let at = folded.indexOf(phrase);
  if (at >= 0) return [at, at + phrase.length];
  at = folded.indexOf(tokens[0]);
  return at >= 0 ? [at, at + tokens[0].length] : null;
};
