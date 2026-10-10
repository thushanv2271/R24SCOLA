import React from "react";
import RNTextInput from "react-native/Libraries/Components/TextInput/TextInput";
import { withAppFont } from "./fonts";

function AppTextInput({ style, ...props }) {
  return <RNTextInput {...props} style={withAppFont(style)} />;
}
AppTextInput.displayName = "TextInput";
AppTextInput.State = RNTextInput.State;

export default AppTextInput;
