import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LanguageContext } from "../LanguageContext";
import KeyboardSafe from "./KeyboardSafe";
import { useTheme } from "../ThemeContext";
import AlertModal from "../AlertModal";

const REASON_KEYS = [
  "reasonFoundScholarship",
  "reasonNotUseful",
  "reasonPrivacy",
  "reasonTooManyNotifications",
  "reasonOther",
];

const DeleteAccountModal = ({ visible, onClose, onConfirm, deleting }) => {
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const [reasonKey, setReasonKey] = useState(null);
  const [note, setNote] = useState("");
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setReasonKey(null);
    setNote("");
    setConfirmVisible(false);
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleContinue = () => {
    if (!reasonKey) {
      setError(t("deleteAccount.selectReasonError"));
      return;
    }
    setError("");
    setConfirmVisible(true);
  };

  const handleFinalConfirm = () => {
    setConfirmVisible(false);
    onConfirm({ reason: t(`deleteAccount.${reasonKey}`), note });
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
        <KeyboardSafe>
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.warningBanner}>
              <View style={styles.warningIconWrap}>
                <Ionicons name="warning" size={24} color="#fff" />
              </View>
              <Text style={styles.title}>{t("deleteAccount.title")}</Text>
              <Text style={styles.warning}>{t("deleteAccount.warning")}</Text>
            </View>

            <Text style={[styles.prompt, { color: colors.textPrimary }]}>{t("deleteAccount.reasonPrompt")}</Text>
            {REASON_KEYS.map((key) => (
              <TouchableOpacity
                key={key}
                style={styles.reasonRow}
                accessibilityRole="radio"
                accessibilityState={{ selected: reasonKey === key }}
                onPress={() => {
                  setReasonKey(key);
                  setError("");
                }}
              >
                <Ionicons
                  name={reasonKey === key ? "radio-button-on" : "radio-button-off"}
                  size={19}
                  color={reasonKey === key ? colors.accent : colors.textMuted}
                />
                <Text style={[styles.reasonText, { color: colors.textSecondary }]}>{t(`deleteAccount.${key}`)}</Text>
              </TouchableOpacity>
            ))}

            <TextInput
              style={[
                styles.noteInput,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              value={note}
              onChangeText={setNote}
              placeholder={t("deleteAccount.notePlaceholder")}
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: colors.surfaceAlt }]}
                onPress={handleClose}
                disabled={deleting}
                accessibilityRole="button"
              >
                <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteBtn, deleting && { opacity: 0.6 }]}
                onPress={handleContinue}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.deleteBtnText}>{t("common.continue")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardSafe>
      </Modal>

      <AlertModal
        visible={confirmVisible}
        title={t("deleteAccount.confirmTitle")}
        message={t("deleteAccount.confirmMessage")}
        type="warning"
        actions={[
          { text: t("common.cancel"), onPress: () => setConfirmVisible(false), secondary: true },
          { text: t("deleteAccount.confirmButton"), onPress: handleFinalConfirm, destructive: true },
        ]}
        onClose={() => setConfirmVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  warningBanner: {
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  warningIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#b91c1c",
    fontFamily: "Roboto",
    textAlign: "center",
  },
  warning: {
    fontSize: 12.5,
    color: "#7f1d1d",
    fontFamily: "Roboto",
    lineHeight: 18,
    marginTop: 6,
    textAlign: "center",
  },
  prompt: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Roboto",
    marginBottom: 8,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
    paddingVertical: 8,
  },
  reasonText: {
    fontSize: 13.5,
    color: "#374151",
    fontFamily: "Roboto",
    flex: 1,
  },
  noteInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    fontSize: 13,
    color: "#111827",
    fontFamily: "Roboto",
    marginTop: 12,
    minHeight: 70,
    textAlignVertical: "top",
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    fontFamily: "Roboto",
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    fontFamily: "Roboto",
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#ef4444",
    alignItems: "center",
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Roboto",
  },
});

export default DeleteAccountModal;
