import React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";

// Lifts its content above the on-screen keyboard. "padding" is used on both
// platforms because Android is edge-to-edge (the window no longer resizes), so
// "height" and adjustResize leave the keyboard covering the focused input.
export default function KeyboardSafe({ children, style, offset = 0 }) {
  return (
    <KeyboardAvoidingView
      style={[styles.fill, style]}
      behavior="padding"
      keyboardVerticalOffset={offset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
