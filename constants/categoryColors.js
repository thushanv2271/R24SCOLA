// Colour + icon for each listing category group (see constants/categories.js).
// Each hue has a light-theme pair (700-level text/icon on a pale tint, all
// above 4.5:1) and a dark-theme pair (300-level text/icon on a translucent
// tint) so category cards stay readable in both themes.
const HUES = {
  teal: { light: { fg: "#0f766e", bg: "#ccfbf1" }, dark: { fg: "#5eead4", bg: "rgba(45, 212, 191, 0.16)" } },
  indigo: { light: { fg: "#4338ca", bg: "#e0e7ff" }, dark: { fg: "#a5b4fc", bg: "rgba(129, 140, 248, 0.18)" } },
  orange: { light: { fg: "#c2410c", bg: "#ffedd5" }, dark: { fg: "#fdba74", bg: "rgba(251, 146, 60, 0.16)" } },
  emerald: { light: { fg: "#047857", bg: "#d1fae5" }, dark: { fg: "#6ee7b7", bg: "rgba(52, 211, 153, 0.16)" } },
  rose: { light: { fg: "#be123c", bg: "#ffe4e6" }, dark: { fg: "#fda4af", bg: "rgba(251, 113, 133, 0.16)" } },
  violet: { light: { fg: "#6d28d9", bg: "#ede9fe" }, dark: { fg: "#c4b5fd", bg: "rgba(167, 139, 250, 0.18)" } },
  cyan: { light: { fg: "#0e7490", bg: "#cffafe" }, dark: { fg: "#67e8f9", bg: "rgba(34, 211, 238, 0.15)" } },
  pink: { light: { fg: "#be185d", bg: "#fce7f3" }, dark: { fg: "#f9a8d4", bg: "rgba(244, 114, 182, 0.16)" } },
  amber: { light: { fg: "#b45309", bg: "#fef3c7" }, dark: { fg: "#fcd34d", bg: "rgba(251, 191, 36, 0.15)" } },
  slate: { light: { fg: "#475569", bg: "#e2e8f0" }, dark: { fg: "#cbd5e1", bg: "rgba(148, 163, 184, 0.18)" } },
  lime: { light: { fg: "#4d7c0f", bg: "#ecfccb" }, dark: { fg: "#bef264", bg: "rgba(163, 230, 53, 0.14)" } },
  sky: { light: { fg: "#0369a1", bg: "#e0f2fe" }, dark: { fg: "#7dd3fc", bg: "rgba(56, 189, 248, 0.16)" } },
  fuchsia: { light: { fg: "#a21caf", bg: "#fae8ff" }, dark: { fg: "#f0abfc", bg: "rgba(232, 121, 249, 0.16)" } },
  red: { light: { fg: "#b91c1c", bg: "#fee2e2" }, dark: { fg: "#fca5a5", bg: "rgba(248, 113, 113, 0.16)" } },
  stone: { light: { fg: "#78350f", bg: "#f5ebe0" }, dark: { fg: "#e7c9a9", bg: "rgba(214, 167, 120, 0.16)" } },
  blue: { light: { fg: "#1d4ed8", bg: "#dbeafe" }, dark: { fg: "#93c5fd", bg: "rgba(96, 165, 250, 0.16)" } },
};

// Icons are Ionicons names. Study fields first, then industries.
const CATEGORY_LOOKS = {
  // Study fields
  "Computing & IT": { hue: "indigo", icon: "laptop" },
  "Engineering": { hue: "orange", icon: "construct" },
  "Architecture & Built Environment": { hue: "stone", icon: "business" },
  "Natural Sciences": { hue: "teal", icon: "flask" },
  "Life Sciences": { hue: "lime", icon: "leaf" },
  "Health & Medicine": { hue: "rose", icon: "medkit" },
  "Environment & Sustainability": { hue: "emerald", icon: "earth" },
  "Agriculture & Food": { hue: "lime", icon: "nutrition" },
  "Business & Economics": { hue: "emerald", icon: "stats-chart" },
  "Hospitality, Tourism & Sport": { hue: "sky", icon: "airplane" },
  "Social Sciences": { hue: "violet", icon: "people" },
  "Humanities & Languages": { hue: "amber", icon: "book" },
  "Arts, Design & Media": { hue: "pink", icon: "color-palette" },
  "Law & Legal Studies": { hue: "blue", icon: "scale" },
  "Education & Teaching": { hue: "fuchsia", icon: "school" },
  "Multidisciplinary": { hue: "slate", icon: "apps" },
  // Industries
  "Software & IT": { hue: "indigo", icon: "code-slash" },
  "Data & AI": { hue: "cyan", icon: "analytics" },
  "Design & Product": { hue: "pink", icon: "brush" },
  "Finance & Banking": { hue: "emerald", icon: "cash" },
  "Healthcare & Life Sciences": { hue: "rose", icon: "heart" },
  "Education & Training": { hue: "fuchsia", icon: "school" },
  "Engineering & Construction": { hue: "orange", icon: "hammer" },
  "Manufacturing & Industrial": { hue: "stone", icon: "cog" },
  "Energy & Utilities": { hue: "amber", icon: "flash" },
  "Sales & Marketing": { hue: "orange", icon: "megaphone" },
  "Business & Professional Services": { hue: "blue", icon: "briefcase" },
  "Legal & Compliance": { hue: "blue", icon: "document-text" },
  "Retail & E-commerce": { hue: "violet", icon: "cart" },
  "Hospitality & Leisure": { hue: "sky", icon: "restaurant" },
  "Transport & Logistics": { hue: "teal", icon: "boat" },
  "Media & Entertainment": { hue: "red", icon: "film" },
  "Telecommunications": { hue: "cyan", icon: "wifi" },
  "Real Estate & Property": { hue: "stone", icon: "home" },
  "Government & Nonprofit": { hue: "red", icon: "flag" },
  "Other Industries": { hue: "slate", icon: "layers" },
};

const FALLBACK_LOOK = { hue: "slate", icon: "pricetag" };

export const hueStyle = (hue, isDark) => (HUES[hue] || HUES.slate)[isDark ? "dark" : "light"];

// Category colours stay inside the app's blue brand family (#004aad) so the
// Home tiles and the Categories page match the rest of the UI. Every "solid"
// takes a white icon at 4.5:1 or better; "solidDark" is lifted for dark mode.
const BRAND_TONES = {
  royal: { solid: "#004aad", solidDark: "#1a5fc4", light: { fg: "#004aad", bg: "#dbe6f7" }, dark: { fg: "#9dbff2", bg: "rgba(77, 140, 230, 0.18)" } },
  indigo: { solid: "#4338ca", solidDark: "#5b52d8", light: { fg: "#4338ca", bg: "#e3e2fa" }, dark: { fg: "#a5a0f5", bg: "rgba(129, 120, 245, 0.18)" } },
  ocean: { solid: "#0369a1", solidDark: "#1b7fb8", light: { fg: "#035d90", bg: "#d8edf8" }, dark: { fg: "#7dd3fc", bg: "rgba(56, 189, 248, 0.16)" } },
  navy: { solid: "#1e3a8a", solidDark: "#3552a8", light: { fg: "#1e3a8a", bg: "#dfe5f5" }, dark: { fg: "#a5b4e8", bg: "rgba(99, 120, 210, 0.18)" } },
  lagoon: { solid: "#0e7490", solidDark: "#1e8aa8", light: { fg: "#0e6b85", bg: "#d5eef3" }, dark: { fg: "#67d4e8", bg: "rgba(34, 211, 238, 0.15)" } },
  azure: { solid: "#0a68c9", solidDark: "#2478d6", light: { fg: "#0a5bb0", bg: "#d9eafb" }, dark: { fg: "#93c5fd", bg: "rgba(96, 165, 250, 0.16)" } },
  steel: { solid: "#475f8a", solidDark: "#5d77a3", light: { fg: "#41567d", bg: "#e2e8f1" }, dark: { fg: "#b4c2dc", bg: "rgba(148, 163, 184, 0.18)" } },
};
const TONE_ORDER = ["royal", "indigo", "ocean", "navy", "lagoon", "azure", "steel"];
const TONE_BY_CATEGORY = {};
Object.keys(CATEGORY_LOOKS).forEach((name, i) => {
  TONE_BY_CATEGORY[name] = TONE_ORDER[i % TONE_ORDER.length];
});

export const toneStyle = (tone, isDark) => (BRAND_TONES[tone] || BRAND_TONES.royal)[isDark ? "dark" : "light"];

export const categoryLook = (name, isDark) => {
  const look = CATEGORY_LOOKS[name] || FALLBACK_LOOK;
  const tone = BRAND_TONES[TONE_BY_CATEGORY[name] || "steel"];
  return {
    icon: look.icon,
    outline: `${look.icon}-outline`,
    solid: isDark ? tone.solidDark : tone.solid,
    ...tone[isDark ? "dark" : "light"],
  };
};

// Gold for anything that represents Scola Coins.
export const COIN_GOLD = "#fbbf24";
