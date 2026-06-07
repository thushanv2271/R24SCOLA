/**
 * Filter Options Constants
 * Extracted from components to prevent recreation on every render
 */

export const MAJORS = [
  "Chemistry",
  "Computer Science",
  "Physics",
  "Engineering",
  "Natural Sciences",
  "Mathematics & Statistics",
  "Business & Economics",
  "Health Sciences",
];

export const COUNTRIES = [
  { name: "Australia", flag: "🇦🇺" },
  { name: "Austria", flag: "🇦🇹" },
  { name: "Belgium", flag: "🇧🇪" },
  { name: "Canada", flag: "🇨🇦" },
  { name: "China", flag: "🇨🇳" },
  { name: "Denmark", flag: "🇩🇰" },
  { name: "Finland", flag: "🇫🇮" },
  { name: "France", flag: "🇫🇷" },
  { name: "Germany", flag: "🇩🇪" },
  { name: "Ireland", flag: "🇮🇪" },
  { name: "Italy", flag: "🇮🇹" },
  { name: "Japan", flag: "🇯🇵" },
  { name: "Malaysia", flag: "🇲🇾" },
  { name: "Malta", flag: "🇲🇹" },
  { name: "Netherlands", flag: "🇳🇱" },
  { name: "New Zealand", flag: "🇳🇿" },
  { name: "Norway", flag: "🇳🇴" },
  { name: "Portugal", flag: "🇵🇹" },
  { name: "Qatar", flag: "🇶🇦" },
  { name: "Russia", flag: "🇷🇺" },
  { name: "Saudi Arabia", flag: "🇸🇦" },
  { name: "Singapore", flag: "🇸🇬" },
  { name: "South Africa", flag: "🇿🇦" },
  { name: "South Korea", flag: "🇰🇷" },
  { name: "Spain", flag: "🇪🇸" },
  { name: "Sri Lanka", flag: "🇱🇰" },
  { name: "Sweden", flag: "🇸🇪" },
  { name: "Switzerland", flag: "🇨🇭" },
  { name: "Turkey", flag: "🇹🇷" },
  { name: "UK", flag: "🇬🇧" },
  { name: "United Arab Emirates (UAE)", flag: "🇦🇪" },
  { name: "United States", flag: "🇺🇸" },
];

export const FUNDING_TYPES = ["full scholar", "Partial scholar"];

export const LANGUAGE_TESTS = ["IELTS", "TOEFL", "PTE", "Duolingo"];

export const STUDY_LEVELS = ["Bachelors", "Masters", "PhD"];

export const SCHOLARSHIP_TYPES = [
  "Merit-based",
  "Need-based",
  "Research-based",
];

export const COUNTRY_OPTIONS = [
  { label: "USA", value: "usa" },
  { label: "UK", value: "uk" },
  { label: "Canada", value: "canada" },
  { label: "Australia", value: "australia" },
  { label: "Germany", value: "germany" },
  { label: "France", value: "france" },
  { label: "Japan", value: "japan" },
  { label: "Netherlands", value: "netherlands" },
  { label: "Sweden", value: "sweden" },
  { label: "Norway", value: "norway" },
  { label: "Finland", value: "finland" },
  { label: "Switzerland", value: "switzerland" },
];

export const RESEARCH_INTEREST_OPTIONS = [
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

export const STUDY_FIELD_OPTIONS = [
  { label: "STEM", value: "stem" },
  { label: "Business", value: "business" },
  { label: "Arts & Humanities", value: "arts" },
  { label: "Social Sciences", value: "social" },
  { label: "Medicine", value: "medicine" },
];

export const EXTRACURRICULARS_OPTIONS = [
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

export const FINANCIAL_NEED_OPTIONS = [
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

export const GPA_OPTIONS = Array.from({ length: 41 }, (_, i) => {
  const value = (i * 0.1).toFixed(1);
  return { label: value.toString(), value: parseFloat(value) };
});

export const IELTS_OPTIONS = Array.from({ length: 36 }, (_, i) => {
  const value = (4.5 + i * 0.5).toFixed(1);
  return { label: value.toString(), value: parseFloat(value) };
});
