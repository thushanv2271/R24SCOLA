import { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import * as Yup from "yup";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Checkbox } from "react-native-paper";
import { styles, getDynamicStyles } from "./styles/styles";
import { AuthContext } from "../components/AuthContext";
import { authAPI } from "../services/apiService";
import { IconSymbol } from "../components/ui/IconSymbol";

const LoginSchema = Yup.object().shape({
  username: Yup.string()
    .trim()
    .matches(/^[a-zA-Z0-9_]{3,20}$/, "Username must be 3-20 characters")
    .required("Username is required"),
  password: Yup.string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
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
  const colorScheme = useColorScheme();
  const dynamicStyles = getDynamicStyles(colorScheme);
  const { login } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved credentials and remember me state
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        // Check if user is already logged in first
        const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");

        // Get remember me preference
        const savedRememberMe = await AsyncStorage.getItem("rememberMe");
        const rememberMeValue = savedRememberMe === "true";
        setRememberMe(rememberMeValue);

        // If remember me was true, get the credentials
        if (rememberMeValue) {
          const savedUsername = await AsyncStorage.getItem("username");

          if (savedUsername) {
            // Set initial values for the form
            setInitialValues({
              username: savedUsername,
              password: "",
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

      // Set login status in AsyncStorage
      await AsyncStorage.setItem("isLoggedIn", "true");
      if (data?.id) {
        await AsyncStorage.setItem("userID", data.id);
      }

      if (data?.token) {
        await AsyncStorage.setItem("userToken", data.token);
      }

      // Store username in AsyncStorage for easy access
      await AsyncStorage.setItem("username", normalizedUsername);

      // Save username only if remember me is checked
      if (rememberMe) {
        await AsyncStorage.setItem("username", normalizedUsername);
        await AsyncStorage.setItem("rememberMe", "true");
      } else {
        // Clear remembered identity if remember me is unchecked
        await AsyncStorage.removeItem("username");
        await AsyncStorage.removeItem("rememberMe");
      }

      router.push("/(tabs)/");
    } catch (error) {
      // Clear login status and saved credentials on failure
      await AsyncStorage.removeItem("isLoggedIn");
      await AsyncStorage.removeItem("username");
      await AsyncStorage.removeItem("rememberMe");
      await AsyncStorage.removeItem("userID");
      await AsyncStorage.removeItem("userToken");

      // Display user-friendly error message
      const errorMsg = error.message || "Login failed";
      alert(errorMsg.replace(/^HTTP \d+$/, "Invalid username or password"));
    } finally {
      setIsSubmitting(false); // Hide loader
    }
  };

  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <Text style={[styles.title, dynamicStyles.title]}>Loading...</Text>
      </View>
    );
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={LoginSchema}
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
        <View style={[styles.container, dynamicStyles.container]}>
          <Image
            source={require("../assets/images/OPPORTUNITIES.png")}
            style={styles.logo}
          />
          <Text style={[styles.title, dynamicStyles.title]}> Login </Text>

          <TextInput
            style={[styles.input, dynamicStyles.input]}
            placeholder="Username"
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

          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, dynamicStyles.input, styles.passwordInput]}
              placeholder="Password"
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
                showPassword ? "Hide password" : "Show password"
              }
            >
              <IconSymbol
                name={showPassword ? "eye.slash.fill" : "eye.fill"}
                size={22}
                color="#333"
              />
            </TouchableOpacity>
          </View>
          {touched.password && errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          <TouchableOpacity
            onPress={toggleRememberMe}
            style={styles.rememberMeContainer}
          >
            <Checkbox status={rememberMe ? "checked" : "unchecked"} />
            <Text style={[styles.rememberMeText, dynamicStyles.switchText]}>
              Remember Me
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}> Login </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/RegisterForm")}>
            <Text style={[styles.switchText, dynamicStyles.switchText]}>
              Don't have an account? Create Account
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Formik>
  );
}
