import React from "react";
import RNText from "react-native/Libraries/Text/Text";
import { withAppFont } from "./fonts";

function AppText({ style, ...props }) {
  return <RNText {...props} style={withAppFont(style)} />;
}
AppText.displayName = "Text";

export default AppText;
