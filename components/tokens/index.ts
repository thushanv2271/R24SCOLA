import { COLORS, BADGE_TONES } from "./colors";
import { SPACING } from "./spacing";
import { RADIUS } from "./radius";
import * as SHADOWS from "./shadows";
import { TYPOGRAPHY } from "./typography";

export const theme = {
  colors: COLORS,
  badgeTones: BADGE_TONES,
  spacing: SPACING,
  radius: RADIUS,
  shadows: { CARD: SHADOWS.CARD, BUTTON_DANGER: SHADOWS.BUTTON_DANGER },
  typography: TYPOGRAPHY,
};

export { COLORS, BADGE_TONES, SPACING, RADIUS, TYPOGRAPHY };
export default theme;
