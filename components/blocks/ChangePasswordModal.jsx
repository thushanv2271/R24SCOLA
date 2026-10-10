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
import { checkPasswordStrength } from "../../utils/passwordPolicy";

const ChangePasswordModal = ({ visible, onClose, onSubmit, submitting }) => {
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!currentPassword) {
      setError(t("changePassword.currentRequired"));
      return;
    }
    const problem = checkPasswordStrength(newPassword);
    if (problem === "tooShort") {
      setError(t("changePassword.tooShort"));
      return;
    }
    if (problem === "weak") {
      setError(t("changePassword.weak"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("changePassword.mismatch"));
      return;
    }
    setError("");
    onSubmit({ currentPassword, newPassword }, reset);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardSafe>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t("changePassword.title")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t("changePassword.subtitle")}
          </Text>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            {t("changePassword.currentPassword")}
          </Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrent}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t("changePassword.currentPasswordPlaceholder")}
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity onPress={() => setShowCurrent((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={showCurrent ? "eye-off-outline" : "eye-outline"} size={19} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            {t("changePassword.newPassword")}
          </Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t("changePassword.newPasswordPlaceholder")}
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity onPress={() => setShowNew((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={19} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            {t("changePassword.confirmPassword")}
          </Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showNew}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t("changePassword.confirmPasswordPlaceholder")}
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {!!error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.surfaceAlt }]} onPress={handleClose} disabled={submitting}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>{t("common.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.accent }, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>{t("changePassword.save")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
      </KeyboardSafe>
    </Modal>
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
    borderRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
  subtitle: {
    fontSize: 12.5,
    fontFamily: "Roboto",
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Roboto",
    marginBottom: 6,
    marginTop: 10,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    fontFamily: "Roboto",
    padding: 0,
  },
  errorText: {
    fontSize: 12.5,
    fontFamily: "Roboto",
    marginTop: 10,
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
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Roboto",
  },
});

export default ChangePasswordModal;
