import React from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { BUTTON_DANGER } from "../tokens/shadows";

// variant="danger" extracted from both Profile screens' identical logoutButton.
// variant="link" extracted from both Profile screens' identical privacyButton
// (icon + text + trailing chevron, used for How to Apply / Privacy Policy rows).
// variant="primary" is the app's standard solid brand-blue action button.
const Button = ({ variant = "danger", label, icon, onPress, disabled }) => {
  const { colors } = useTheme();
  if (variant === "link") {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={styles.linkButton}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {icon && <Ionicons name={icon} size={18} color={colors.textSecondary} />}
        <Text style={[styles.linkButtonText, { color: colors.textSecondary }]} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  }

  if (variant === "primary") {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.primaryButton, disabled && styles.buttonDisabled]}
        activeOpacity={0.85}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!disabled }}
      >
        {icon && <Ionicons name={icon} size={20} color="#fff" />}
        <Text style={[styles.primaryButtonText, icon && { marginLeft: 8 }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.dangerButton, disabled && styles.buttonDisabled]}
      activeOpacity={0.8}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
    >
      {icon && <Ionicons name={icon} size={22} color="#fff" />}
      <Text style={styles.dangerButtonText}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: "#004aad",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#004aad",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    fontFamily: "Roboto",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dangerButton: {
    backgroundColor: "#ef4444",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...BUTTON_DANGER,
  },
  dangerButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
    fontFamily: "Roboto",
    marginLeft: 8,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 8,
    marginBottom: 10,
    gap: 8,
  },
  linkButtonText: {
    color: "#666",
    fontSize: 15,
    fontFamily: "Roboto",
    flex: 1,
    textAlign: "center",
  },
});

export default Button;
