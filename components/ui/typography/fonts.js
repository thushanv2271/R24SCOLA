import { StyleSheet } from "react-native";

// The app's type scale. Screens were written with ~20 slightly different sizes
// (11, 11.5, 12.5, 13, 13.5, 14.5, 15, 15.5, 17...). Every size is snapped to
// the nearest step here (ties go to the smaller step so text never grows much).
// Font families and weights are left exactly as each style declares them.
const SIZE_STEPS = [
  [13, 12],
  [15, 14],
  [17, 16],
  [19, 18],
  [22, 20],
  [26, 24],
  [30, 28],
  [36, 32],
];

const snapSize = (size) => {
  for (const [max, step] of SIZE_STEPS) {
    if (size <= max) return step;
  }
  return size;
};

// Most screens (Explore, Jobs, ...) declare this family on every text style.
// Home and the shared blocks don't, so their text fell back to the device's
// default font and was clipped at the end of self-sized chips and links.
const APP_FONT_FAMILY = "Roboto";

export function withAppFont(style) {
  const flat = StyleSheet.flatten(style) || {};
  const override = {};
  if (!flat.fontFamily) override.fontFamily = APP_FONT_FAMILY;

  if (typeof flat.fontSize === "number") {
    const size = snapSize(flat.fontSize);
    if (size !== flat.fontSize) {
      override.fontSize = size;
      if (typeof flat.lineHeight === "number") {
        override.lineHeight = Math.round((flat.lineHeight * size) / flat.fontSize);
      }
    }
  }
  return Object.keys(override).length ? [style, override] : style;
}
