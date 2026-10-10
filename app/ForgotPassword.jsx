import { useContext, useEffect, useMemo, useState } from "react";
import Animated from "react-native-reanimated";
import { useShake } from "../components/ui/motion";
import {
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { createStyles } from "./styles/styles";
import AlertModal from "../components/AlertModal";
import KeyboardSafe from "../components/blocks/KeyboardSafe";
import { authAPI } from "../services/apiService";
import { IconSymbol } from "../components/ui/IconSymbol";
import { LanguageContext } from "../components/LanguageContext";
import { useTheme } from "../components/ThemeContext";
import { checkPasswordStrength } from "../utils/passwordPolicy";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export default function ForgotPassword() {
  const router = useRouter();
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [step, setStep] = useState("request");
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);

  const { shakeStyle, shake } = useShake();
  useEffect(() => {
    if (error) shake();
  }, [error]);

  const normalizedUsername = username.trim().toLowerCase();

  const describeError = (err, fallbackKey) => {
    if (err?.isNetworkError) return t("auth.noInternetMessage");
    if (err?.status === 429) return t("forgot.tooMany");
    return t(fallbackKey);
  };

  const handleSendCode = async () => {
    if (busy) return;
    if (!USERNAME_PATTERN.test(username.trim())) {
      setError(t("auth.usernameInvalid"));
      return;
    }
    setError("");
    setBusy(true);
    try {
      await authAPI.forgotPassword(normalizedUsername);
      setStep("reset");
    } catch (err) {
      setError(describeError(err, "forgot.requestFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (busy) return;
    if (!/^\d{6}$/.test(code.trim())) {
      setError(t("forgot.codeRequired"));
      return;
    }
    const problem = checkPasswordStrength(newPassword);
    if (problem === "tooShort") {
      setError(t("auth.passwordTooShort"));
      return;
    }
    if (problem === "weak") {
      setError(t("auth.passwordNeedsMix"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("auth.passwordsMustMatch"));
      return;
    }
    setError("");
    setBusy(true);
    try {
      await authAPI.resetPassword(normalizedUsername, code.trim(), newPassword);
      setAlertVisible(true);
    } catch (err) {
      const invalid = err?.status === 400 && /invalid or expired/i.test(err?.message || "");
      setError(invalid ? t("forgot.invalidCode") : describeError(err, "forgot.failed"));
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    setStep("request");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  return (
    <>
      <KeyboardSafe style={{ backgroundColor: colors.screenBackground }}>
<ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Image source={require("../assets/images/OPPORTUNITIES.png")} style={styles.logo} />
          <Animated.View style={[styles.formCard, shakeStyle]}>
            <Text style={styles.title}>{t("forgot.title")}</Text>
            <Text style={styles.subtitle}>
              {step === "request" ? t("forgot.requestSubtitle") : t("forgot.sentSubtitle")}
            </Text>

            {step === "request" ? (
              <>
                <Text style={styles.fieldLabel}>{t("auth.username")}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t("auth.usernamePlaceholder")}
                  placeholderTextColor={colors.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="username"
                />
                <Text style={styles.hintText}>{t("forgot.noEmailNote")}</Text>
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>{t("forgot.codeLabel")}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t("forgot.codePlaceholder")}
                  placeholderTextColor={colors.textMuted}
                  value={code}
                  onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoCorrect={false}
                  textContentType="oneTimeCode"
                />

                <Text style={styles.fieldLabel}>{t("forgot.newPassword")}</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder={t("auth.createPassword")}
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword((prev) => !prev)}
                    accessibilityLabel={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  >
                    <IconSymbol
                      name={showPassword ? "eye.slash.fill" : "eye.fill"}
                      size={22}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.hintText}>{t("auth.passwordHint")}</Text>

                <Text style={styles.fieldLabel}>{t("auth.confirmPassword")}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t("auth.reenterPassword")}
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                />
              </>
            )}

            {!!error && <Text style={[styles.errorText, { marginTop: 0 }]}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, busy && styles.buttonDisabled]}
              onPress={step === "request" ? handleSendCode : handleReset}
              disabled={busy}
              accessibilityRole="button"
            >
              {busy ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>
                  {step === "request" ? t("forgot.sendCode") : t("forgot.resetButton")}
                </Text>
              )}
            </TouchableOpacity>

            {step === "reset" && (
              <TouchableOpacity onPress={restart} style={styles.switchRow}>
                <Text style={styles.switchCTA}>{t("forgot.resend")}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => router.replace("/login")} style={styles.switchRow}>
              <Text style={styles.switchCTA}>{t("forgot.backToLogin")}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
</KeyboardSafe>
      <AlertModal
        visible={alertVisible}
        title={t("forgot.successTitle")}
        message={t("forgot.successMessage")}
        type="success"
        onClose={() => {
          setAlertVisible(false);
          router.replace("/login");
        }}
      />
    </>
  );
}
