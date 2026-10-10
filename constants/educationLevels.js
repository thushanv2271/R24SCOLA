// Stable keys stored in the database and sent to the backend as-is — never
// translated strings, so a saved selection still matches correctly after the
// user switches app language.
export const EDUCATION_LEVELS = [
  { key: "high_school", labelKey: "personalDetails.eduHighSchool" },
  { key: "undergraduate", labelKey: "personalDetails.eduUndergraduate" },
  { key: "graduate", labelKey: "personalDetails.eduGraduate" },
  { key: "postgraduate", labelKey: "personalDetails.eduPostgraduate" },
];

export const educationLevelLabelKey = (key) =>
  EDUCATION_LEVELS.find((level) => level.key === key)?.labelKey || null;
