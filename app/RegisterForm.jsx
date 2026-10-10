import { useContext, useMemo, useState } from "react";
import {
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import * as Yup from "yup";
import { createStyles } from "./styles/styles";
import LoaderModal from "../components/ui/LoaderModal";
import KeyboardSafe from "../components/blocks/KeyboardSafe";
import AlertModal from "../components/AlertModal";
import { authAPI } from "../services/apiService";
import { IconSymbol } from "../components/ui/IconSymbol";
import { LanguageContext } from "../components/LanguageContext";
import { useTheme } from "../components/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { checkPasswordStrength } from "../utils/passwordPolicy";
import { PENDING_WELCOME_BONUS_KEY } from "../constants/coins";
import { showLocalNotification } from "../services/pushNotifications";

const buildRegisterSchema = (t) =>
  Yup.object().shape({
    username: Yup.string()
      .trim()
      .matches(/^[a-zA-Z0-9_]{3,20}$/, t("auth.usernameInvalid"))
      .required(t("auth.usernameRequired")),
    email: Yup.string()
      .trim()
      .email(t("auth.emailInvalid")),
    password: Yup.string()
      .required(t("auth.passwordRequired"))
      .test("strength", function (value) {
        const problem = checkPasswordStrength(value);
        if (problem === "tooShort") {
          return this.createError({ message: t("auth.passwordTooShort") });
        }
        if (problem === "weak") {
          return this.createError({ message: t("auth.passwordNeedsMix") });
        }
        return true;
      }),
    confirmPassword: Yup.string()
      .required(t("auth.confirmRequired"))
      .oneOf([Yup.ref("password"), null], t("auth.passwordsMustMatch")),
  });

export default function RegisterForm() {
  const router = useRouter();
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const registerSchema = useMemo(() => buildRegisterSchema(t), [t]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "" });
  const closeAlert = () => setAlertConfig((prev) => ({ ...prev, visible: false }));

  const handleRegister = async (values, { setFieldError }) => {
    try {
      const normalizedUsername = values.username.trim().toLowerCase();

      // Register new user with only required fields
      await authAPI.register({
        username: normalizedUsername,
        password: values.password,
        email: values.email.trim(),
        age: 25,
        country: "United States",
      });

      // The big 1000-coin treasure-chest celebration plays on the Home
      // screen (first visit after this account logs in), not here — this
      // flag is how Home knows to show it exactly once for this user.
      await AsyncStorage.setItem(PENDING_WELCOME_BONUS_KEY, normalizedUsername);

      // Account created: tell the phone straight away (best effort).
      showLocalNotification(normalizedUsername, {
        title: t("coinNotice.createdTitle"),
        body: t("coinNotice.createdBody", { amount: "1,000" }),
        data: { type: "welcome" },
      });

      setIsModalVisible(true);

      const timer = setTimeout(() => {
        router.push("/login");
        setIsModalVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    } catch (error) {
      // Handle duplicate email error from backend
      const errorMsg = error.message || t("auth.registerFailed");
      if (
        errorMsg.toLowerCase().includes("already exists") ||
        errorMsg.toLowerCase().includes("already in use")
      ) {
        setFieldError("username", t("auth.usernameTaken"));
      } else if (error.isNetworkError) {
        setAlertConfig({
          visible: true,
          title: t("auth.noInternetTitle"),
          message: t("auth.noInternetMessage"),
          type: "warning",
        });
      } else if (errorMsg.toLowerCase().includes("required")) {
        setAlertConfig({
          visible: true,
          title: t("auth.registerFailedTitle"),
          message: t("auth.registerRequired"),
          type: "error",
        });
      } else {
        setAlertConfig({
          visible: true,
          title: t("auth.registerFailedTitle"),
          message: /^HTTP \d+$/.test(errorMsg) ? t("auth.registerFailed") : errorMsg,
          type: "error",
        });
      }
    }
  };

  return (
    <Formik
      initialValues={{
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      }}
      validationSchema={registerSchema}
      onSubmit={handleRegister}
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
            <View style={styles.formCard}>
            <Text style={styles.title}>
              {t("auth.createAccount")}
            </Text>
            <Text style={styles.subtitle}>
              {t("auth.joinDesc")}
            </Text>

            <Text style={styles.fieldLabel}>{t("auth.username")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("auth.chooseUsername")}
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

            <Text style={styles.fieldLabel}>{t("auth.emailLabel")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("auth.emailPlaceholder")}
              placeholderTextColor={colors.textMuted}
              onChangeText={handleChange("email")}
              onBlur={handleBlur("email")}
              value={values.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
            />
            {touched.email && errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : (
              <Text style={styles.hintText}>
                {t("auth.emailHint")}
              </Text>
            )}

            <Text style={styles.fieldLabel}>{t("auth.password")}</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder={t("auth.createPassword")}
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
            {touched.password && errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : (
              <Text style={styles.hintText}>
                {t("auth.passwordHint")}
              </Text>
            )}

            <Text style={styles.fieldLabel}>{t("auth.confirmPassword")}</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder={t("auth.reenterPassword")}
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showConfirmPassword}
                onChangeText={handleChange("confirmPassword")}
                onBlur={handleBlur("confirmPassword")}
                value={values.confirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                accessibilityLabel={
                  showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")
                }
              >
                <IconSymbol
                  name={showConfirmPassword ? "eye.slash.fill" : "eye.fill"}
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {touched.confirmPassword && errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>{t("auth.createAccount")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/login")}
              style={styles.switchRow}
            >
              <Text style={styles.switchPrompt}>{t("auth.alreadyHaveAccount")}</Text>
              <Text style={styles.switchCTA}>{t("auth.login")}</Text>
            </TouchableOpacity>
            </View>
            <LoaderModal visible={isModalVisible} variant="success" />
            <AlertModal
              visible={alertConfig.visible}
              title={alertConfig.title}
              message={alertConfig.message}
              type={alertConfig.type}
              onClose={closeAlert}
            />
          </View>
        </ScrollView>
</KeyboardSafe>
      )}
    </Formik>
  );
}
