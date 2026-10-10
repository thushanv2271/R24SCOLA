import React, { useContext, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import AlertModal from "../AlertModal";
import { LanguageContext } from "../LanguageContext";
import { useTheme } from "../ThemeContext";
import { PressableScale, haptic } from "../ui/motion";

// Icon-only "Request" action shared by Explore cards and Favourites. By default
// tapping it asks for confirmation first, showing the coin cost and the current
// balance, because the request spends coins and emails a real contact.
const RequestButton = ({
  label,
  requestedLabel,
  cost,
  balance,
  sending = false,
  requested = false,
  failed = false,
  confirm = true,
  onConfirm,
}) => {
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const wasRequested = useRef(requested);

  useEffect(() => {
    if (requested && !wasRequested.current) haptic("success");
    wasRequested.current = requested;
  }, [requested]);

  if (requested) {
    return (
      <Animated.View
        entering={wasRequested.current ? undefined : ZoomIn.springify().damping(12)}
        style={[styles.button, { backgroundColor: colors.successLight }]}
        accessibilityRole="text"
        accessibilityLabel={requestedLabel}
      >
        <Ionicons name="checkmark" size={20} color={colors.success} />
      </Animated.View>
    );
  }

  return (
    <>
      <PressableScale
        scaleTo={0.9}
        feedback
        style={[
          styles.button,
          { backgroundColor: failed ? colors.errorLight || "#fee2e2" : colors.accent },
          sending && styles.disabled,
        ]}
        onPress={() => (confirm ? setConfirmVisible(true) : onConfirm())}
        disabled={sending}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: sending, busy: sending }}
      >
        {sending ? (
          <ActivityIndicator size="small" color={failed ? "#dc2626" : "#fff"} />
        ) : failed ? (
          <Ionicons name="refresh" size={18} color="#dc2626" />
        ) : (
          <Ionicons name="paper-plane" size={17} color="#fff" />
        )}
      </PressableScale>
      <AlertModal
        visible={confirmVisible}
        type="info"
        title={t("ui.confirm.requestTitle")}
        message={t("ui.confirm.requestMessage", {
          cost: String(cost ?? "—"),
          balance: String(balance ?? "—"),
        })}
        onClose={() => setConfirmVisible(false)}
        actions={[
          { text: t("common.cancel"), secondary: true },
          {
            text: t("ui.confirm.requestConfirm", { cost: String(cost ?? "—") }),
            onPress: onConfirm,
          },
        ]}
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default RequestButton;
