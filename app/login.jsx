import { useState, useEffect, useContext, useMemo } from "react";
import {
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import * as Yup from "yup";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { createStyles } from "./styles/styles";
import { AuthContext } from "../components/AuthContext";
import { LanguageContext } from "../components/LanguageContext";
import { useTheme } from "../components/ThemeContext";
import { authAPI } from "../services/apiService";
import { IconSymbol } from "../components/ui/IconSymbol";
import AlertModal from "../components/AlertModal";
import KeyboardSafe from "../components/blocks/KeyboardSafe";
import Animated from "react-native-reanimated";
import { useShake } from "../components/ui/motion";
import { secureSetItem, secureGetItem, secureRemoveItem } from "../services/secureStorage";

// Login only checks presence — accounts created under the older, looser
// password rules must still be able to sign in.
const buildLoginSchema = (t) =>
  Yup.object().shape({
    username: Yup.string()
      .trim()
      .matches(/^[a-zA-Z0-9_]{3,20}$/, t("auth.usernameInvalid"))
      .required(t("auth.usernameRequired")),
    password: Yup.string().required(t("auth.passwordRequired")),
  });

export default function LoginForm() {
  const router = useRouter();
  const [rememberMe, setRememberMe] = useState(false);
  const [initialValues, setInitialValues] = useState({
    username: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for login button loading
  const [showPassword, setShowPassword] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { login } = useContext(AuthContext);
  const { t, language, languageConfigured } = useContext(LanguageContext);
  const loginSchema = useMemo(() => buildLoginSchema(t), [t]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "" });
  const closeAlert = () => setAlertConfig((prev) => ({ ...prev, visible: false }));

  // Load saved credentials and remember me state
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        // "Welcome Back" only makes sense for someone who has logged in
        // on this device before — new users get a neutral greeting.
        const hasLoggedInBefore =
          await AsyncStorage.getItem("hasLoggedInBefore");
        setIsReturningUser(hasLoggedInBefore === "true");

        // Get remember me preference
        const savedRememberMe = await AsyncStorage.getItem("rememberMe");
        const rememberMeValue = savedRememberMe === "true";
        setRememberMe(rememberMeValue);

        // If remember me was true, get the credentials
        if (rememberMeValue) {
          const savedUsername = await AsyncStorage.getItem("username");
          const savedPassword = await secureGetItem("password");

          if (savedUsername) {
            // Set initial values for the form
            setInitialValues({
              username: savedUsername,
              password: savedPassword || "",
            });
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading saved state:", error);
        setIsLoading(false);
      }
    };

    loadSavedState();
  }, []);

  const { shakeStyle, shake } = useShake();

  const handleLogin = async (values) => {
    try {
      setIsSubmitting(true); // Show loader

      const normalizedUsername = values.username.trim().toLowerCase();

      // Login user
      const data = await authAPI.login({
        username: normalizedUsername,
        password: values.password,
      });

      // Ensure username is included in the user data
      const userDataWithUsername = {
        ...data,
        username: normalizedUsername,
      };

      await login(userDataWithUsername);

      // A language picked before signing in should follow the account.
      if (languageConfigured) {
        authAPI.updateLanguage(normalizedUsername, language).catch(() => {});
      }

      // Set login status in AsyncStorage
      await AsyncStorage.setItem("isLoggedIn", "true");
      // Survives logout on purpose — marks this device as a returning user.
      await AsyncStorage.setItem("hasLoggedInBefore", "true");
      if (data?.id) {
        await AsyncStorage.setItem("userID", data.id);
      }

      // Store username in AsyncStorage for easy access
      await AsyncStorage.setItem("username", normalizedUsername);

      // Save credentials only if remember me is checked. The password is
      // the one credential worth protecting here — it goes to SecureStore
      // (Keychain/Keystore), not a plain AsyncStorage file.
      if (rememberMe) {
        await AsyncStorage.setItem("username", normalizedUsername);
        await secureSetItem("password", values.password);
        await AsyncStorage.setItem("rememberMe", "true");
      } else {
        // Clear remembered identity if remember me is unchecked
        await AsyncStorage.removeItem("username");
        await secureRemoveItem("password");
        await AsyncStorage.removeItem("rememberMe");
      }

      router.replace("/(tabs)");
    } catch (error) {
      // Clear login status and saved credentials on failure
      await AsyncStorage.removeItem("isLoggedIn");
      await AsyncStorage.removeItem("username");
      await secureRemoveItem("password");
      await AsyncStorage.removeItem("rememberMe");
      await AsyncStorage.removeItem("userID");
      await secureRemoveItem("userToken");

      // Display a user-friendly, styled alert instead of the raw native
      // alert() this used to call — a network failure (no connectivity)
      // now gets its own clear title/message rather than showing whatever
      // technical string the fetch layer happened to throw.
      const rawMsg = error.message || "";
      const errorMsg = error.isNetworkError
        ? t("auth.noInternetMessage")
        : !rawMsg || /^HTTP \d+$/.test(rawMsg) || error.status === 401
          ? t("auth.invalidCredentials")
          : rawMsg;
      shake();
      setAlertConfig({
        visible: true,
        title: error.isNetworkError ? t("auth.noInternetTitle") : t("auth.loginFailedTitle"),
        message: errorMsg,
        type: error.isNetworkError ? "warning" : "error",
      });
    } finally {
      setIsSubmitting(false); // Hide loader
    }
  };

  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { flex: 1 }]}>
        <Text style={styles.title}>{t("common.loading")}</Text>
      </View>
    );
  }

  return (
    <>
    <Formik
      initialValues={initialValues}
      validationSchema={loginSchema}
      onSubmit={handleLogin}
      enableReinitialize={true}
    >
      {({
        handleChange,
        handleBlur,
        handleSubmit,
        values,
        errors,
        touched,
      }) => (
        <KeyboardSafe style={{ backgroundColor: colors.screenBackground }}>
<ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.container}>
          <Image
              source={require("../assets/images/OPPORTUNITIES.png")}
              style={styles.logo}
            />
          <Animated.View style={[styles.formCard, shakeStyle]}>
          <Text style={styles.title}>
            {isReturningUser ? t("auth.welcomeBack") : t("auth.welcome")}
          </Text>
          <Text style={styles.subtitle}>
            {isReturningUser
              ? t("auth.signInDescReturning")
              : t("auth.signInDescNew")}
          </Text>

          <Text style={styles.fieldLabel}>{t("auth.username")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("auth.usernamePlaceholder")}
            placeholderTextColor={colors.textMuted}
            onChangeText={handleChange("username")}
            onBlur={handleBlur("username")}
            value={values.username}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
          />
          {touched.username && errors.username && (
            <Text style={styles.errorText}>{errors.username}</Text>
          )}

          <Text style={styles.fieldLabel}>{t("auth.password")}</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder={t("auth.passwordPlaceholder")}
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              onChangeText={handleChange("password")}
              onBlur={handleBlur("password")}
              value={values.password}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword((prev) => !prev)}
              accessibilityLabel={
                showPassword ? t("auth.hidePassword") : t("auth.showPassword")
              }
            >
              <IconSymbol
                name={showPassword ? "eye.slash.fill" : "eye.fill"}
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          {touched.password && errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          <View style={styles.optionsRow}>
            <TouchableOpacity
              onPress={toggleRememberMe}
              style={styles.rememberMeContainer}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberMe }}
            >
              <View
                style={[
                  styles.rememberCircle,
                  rememberMe
                    ? { backgroundColor: colors.accent, borderColor: colors.accent }
                    : { borderColor: colors.textMuted },
                ]}
              >
                {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.rememberMeText}>
                {t("auth.rememberMe")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/ForgotPassword")}
              style={styles.linkRow}
              accessibilityRole="link"
            >
              <Text style={styles.linkText}>{t("ui.auth.forgotPassword")}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>{t("auth.login")}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/RegisterForm")}
            style={styles.switchRow}
          >
            <Text style={styles.switchPrompt}>{t("auth.dontHaveAccount")}</Text>
            <Text style={styles.switchCTA}>{t("auth.createAccount")}</Text>
          </TouchableOpacity>
          </Animated.View>
        </View>
        </ScrollView>
</KeyboardSafe>
      )}
    </Formik>
    <AlertModal
      visible={alertConfig.visible}
      title={alertConfig.title}
      message={alertConfig.message}
      type={alertConfig.type}
      onClose={closeAlert}
    />
    </>
  );
}
