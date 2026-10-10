// Design-token colors. Extends the existing constants/colors.js palette
// (kept as-is and still used directly by AlertModal.jsx / utils/lazyLoad.js)
// with the additional values the new shared components need.
import { COLORS as BASE_COLORS } from "../../constants/colors";

export const COLORS = {
  ...BASE_COLORS,
  // Dark heading color used across most screens — distinct from the
  // existing TEXT_PRIMARY (#333) so nothing already relying on that key changes.
  HEADING: "#111827",
};

export const BADGE_TONES = {
  success: { bg: "#d1fae5", text: "#065f46" },
  error: { bg: "#fee2e2", text: "#991b1b" },
  warning: { bg: "#fef3c7", text: "#92400e" },
};

export default COLORS;
