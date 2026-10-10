import { loadListings } from "../services/listingsCache";
import { KIND_COMPANY, KIND_UNIVERSITY, normalizeCountry } from "../constants/categories";
import { fold, searchListings } from "./listingSearch";

// Hoot's brain. It runs on the phone: how-to questions map to the guided tour
// topics, and "find me ..." questions search the same listings Explore shows.
// Replies are { key, params, results, actions } so the chat can translate them.
// Understanding free text works best in English; the suggestion chips and every
// reply are translated, and names (countries, universities, companies) match in
// any language.

const TOPICS = [
  { step: "theme", re: /\b(theme|dark mode|light mode|dark|appearance|colou?rs?)\b/ },
  { step: "language", re: /\b(language|languages|translate|translation)\b(?!\s*(test|tests|requirement|requirements))/ },
  { step: "feedback", re: /\b(sound|sounds|haptic|haptics|vibration|vibrate|mute|silent)\b/ },
  { step: "notifications", re: /\b(notification|notifications|alert|alerts|push)\b/ },
  { step: "mail", re: /\b(e ?mail|mail|cover letter|message template)\b/ },
  { step: "details", re: /\b(profile|personal details|my details|my info|my information|complete my)\b/ },
  { step: "eligibility", re: /\b(eligib\w*|qualify|calculator|chances|gpa|grades?|marks)\b/ },
  { step: "request", re: /\b(request|requests|apply|application|applying|send)\b/ },
  { step: "save", re: /\b(save|saved|favou?rites?|bookmark|heart)\b/ },
];

const COINS = /\b(coin|coins|wallet|balance|credits?|top ?up|buy|purchase|pay|payment|price|cost)\b/;
const COMMUNITY = /\b(community|forum|posts?)\b/;
const HELLO = /^(hi|hello|hey|hiya|yo|good (morning|afternoon|evening))\b/;
const THANKS = /\b(thanks|thank you|thx|cheers)\b/;
const WHO = /\b(who are you|your name|what are you|what can you do|what do you do)\b/;
const HELP = /^(help|help me|menu|options|topics|tour|guide)\b|\b(how (do|can|to)|show me around|teach me|tutorial)\b/;

const JOB_WORDS = /\b(job|jobs|company|companies|internship|internships|career|careers|hiring|employer|employers|vacancy|vacancies|work|remote)\b/;
const UNI_WORDS = /\b(scholarship|scholarships|university|universities|college|colleges|study|studying|degree|degrees|course|courses|programme|programmes|program|programs|funded)\b/;

const LEVELS = [
  { re: /\b(phd|doctorate|doctoral)\b/, level: "PhD" },
  { re: /\b(masters?|msc|postgrad\w*)\b/, level: "Masters" },
  { re: /\b(bachelors?|undergrad\w*|bsc)\b/, level: "Bachelors" },
];

const STOP = new Set(
  `a an the in on at for of to from with and or me my i we you your is are am be can could would should please pls
   find show search list give get any some all what which where who how many much do does there that this these those
   looking look want need like about tell more info information details available options opportunities opportunity
   fully full free funded funding best top good new latest recent open ${"scholarship scholarships university universities college colleges study studying degree degrees course courses programme programmes program programs job jobs company companies internship internships career careers hiring employer employers vacancy vacancies work remote"}
   masters master msc phd doctorate doctoral bachelors bachelor undergraduate undergrad bsc postgraduate postgrad`
    .split(/\s+/)
    .filter(Boolean),
);

const clean = (text) => fold(text).replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

const searchTerms = (text) => {
  const words = clean(text)
    .split(" ")
    .filter((w) => w && !STOP.has(w));
  return words.map((w) => {
    const country = normalizeCountry(w);
    return country !== w && country.toLowerCase() !== w ? fold(country) : w;
  });
};

const toResult = (item) => ({
  id: String(item.id ?? `${item.title}-${item.university}`),
  kind: item.listingKind === KIND_COMPANY ? "company" : "university",
  title: item.title || "",
  org: item.university || "",
  country: item.country || "",
  level: item.listingKind === KIND_UNIVERSITY ? item.level || "" : item.type || "",
  funding: item.listingKind === KIND_UNIVERSITY ? (typeof item.funding === "string" ? item.funding : "") : "",
});

const exploreAction = (kind, query, label = "setup.chat.seeAll") => ({
  type: "explore",
  tab: kind === "company" ? "jobs" : "scholarships",
  query,
  label,
});

const tourAction = (step) => ({ type: "tour", step, label: "setup.chat.showMe" });

const searchFor = async (text, kindHint) => {
  const terms = searchTerms(text);
  const levelHit = LEVELS.find((l) => l.re.test(clean(text)));
  const listings = await loadListings();
  const pools = {
    university: listings.filter((l) => l.listingKind !== KIND_COMPANY),
    company: listings.filter((l) => l.listingKind === KIND_COMPANY),
  };
  const kinds = kindHint ? [kindHint] : ["university", "company"];

  let best = null;
  for (const kind of kinds) {
    let hits = terms.length ? searchListings(pools[kind], terms.join(" ")) : pools[kind];
    if (levelHit && kind === "university") {
      const filtered = hits.filter((h) => h.level === levelHit.level);
      if (filtered.length) hits = filtered;
    }
    if (!best || hits.length > best.hits.length) best = { kind, hits };
  }
  return { terms, ...best };
};

export const respond = async (rawText) => {
  const text = clean(rawText);
  if (!text) return { key: "setup.chat.fallback" };

  if (HELLO.test(text) && text.split(" ").length <= 4) return { key: "setup.chat.hello", topics: true };
  if (THANKS.test(text) && text.split(" ").length <= 5) return { key: "setup.chat.thanks" };
  if (WHO.test(text)) return { key: "setup.chat.helpAll", topics: true };

  const isJob = JOB_WORDS.test(text);
  const isUni = UNI_WORDS.test(text) || LEVELS.some((l) => l.re.test(text));
  const wantsSearch = /\b(find|show|search|list|give|looking|look|any|recommend|suggest)\b/.test(text) || isJob || isUni;

  // How-to topics beat search unless the question is clearly about listings.
  if (!(wantsSearch && (isJob || isUni) && searchTerms(text).length)) {
    const topic = TOPICS.find((tp) => tp.re.test(text));
    if (topic && !(isUni && topic.step === "request" && searchTerms(text).length)) {
      return { key: `setup.tour.${topic.step}`, actions: [tourAction(topic.step)] };
    }
    if (COINS.test(text)) return { key: "setup.chat.coins", actions: [{ type: "route", route: "/Wallet", label: "setup.chat.openWallet" }] };
    if (COMMUNITY.test(text)) return { key: "setup.chat.community", actions: [{ type: "route", route: "/Community", label: "setup.chat.openCommunity" }] };
  }

  const kindHint = isJob && !isUni ? "company" : isUni && !isJob ? "university" : null;
  const terms = searchTerms(text);

  if (!terms.length && (isJob || isUni)) {
    return { key: kindHint === "company" ? "setup.chat.askJobs" : "setup.chat.askScholarship" };
  }

  if (!terms.length && HELP.test(text)) return { key: "setup.chat.helpAll", topics: true };

  if (terms.length || isJob || isUni) {
    try {
      const { kind, hits, terms: used } = await searchFor(text, kindHint);
      const query = used.join(" ");
      if (hits.length && (used.length || wantsSearch)) {
        return {
          key: "setup.chat.found",
          params: { n: String(hits.length), q: query || (kind === "company" ? "jobs" : "scholarships") },
          results: hits.slice(0, 3).map(toResult),
          actions: [exploreAction(kind, query)],
        };
      }
      if (used.length) return { key: "setup.chat.none", params: { q: query } };
    } catch {
      return { key: "setup.chat.fallback" };
    }
  }

  if (HELP.test(text)) return { key: "setup.chat.helpAll", topics: true };
  return { key: "setup.chat.fallback", topics: true };
};
