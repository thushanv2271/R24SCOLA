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
import { styles, getDynamicStyles } from "../app/styles/styles";
import { AuthContext } from "../components/AuthContext";

const LoginSchema = Yup.object().shape({
  email: Yup.string().required("username is required   "),
  password: Yup.string()
    .required("Password is required   ")
    .min(6, "Password too short   "),
});

export default function LoginForm() {
  const router = useRouter();
  const [rememberMe, setRememberMe] = useState(false);
  const [initialValues, setInitialValues] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for login button loading
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
          const savedEmail = await AsyncStorage.getItem("userEmail");
          const savedPassword = await AsyncStorage.getItem("userPassword");

          if (savedEmail && savedPassword) {
            // Set initial values for the form
            setInitialValues({
              email: savedEmail,
              password: savedPassword,
            });

            // If not already logged in, perform auto-login
            if (isLoggedIn !== "true") {
              // Use a slight delay to ensure component is fully mounted
              setTimeout(() => {
                handleLogin({ email: savedEmail, password: savedPassword });
              }, 100);
            }
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
      const userCheckResponse = await fetch(
        `https://webapplication2-old-pond-3577.fly.dev/api/Users/${values.email}`
      );
      if (!userCheckResponse.ok) throw new Error("User not found");

      const loginResponse = await fetch(
        "https://webapplication2-old-pond-3577.fly.dev/api/Users/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );

      if (!loginResponse.ok) throw new Error("Incorrect password");

      const data = await loginResponse.json();
      await login(data);

      // Set login status in AsyncStorage
      await AsyncStorage.setItem("isLoggedIn", "true");

      // Save credentials if remember me is checked
      if (rememberMe) {
        await AsyncStorage.setItem("userEmail", values.email);
        await AsyncStorage.setItem("userPassword", values.password);
        await AsyncStorage.setItem("rememberMe", "true");
      } else {
        // Clear saved credentials if remember me is unchecked
        await AsyncStorage.removeItem("userEmail");
        await AsyncStorage.removeItem("userPassword");
        await AsyncStorage.removeItem("rememberMe");
      }

      router.push({ pathname: "/", params: { email: values.email } });
    } catch (error) {
      // Clear login status on failure
      await AsyncStorage.removeItem("isLoggedIn");
      alert(error.message || "Login failed");
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
            onChangeText={handleChange("email")}
            onBlur={handleBlur("email")}
            value={values.email}
            keyboardType="email-address"
          />
          {touched.email && errors.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}

          <TextInput
            style={[styles.input, dynamicStyles.input]}
            placeholder="Password"
            secureTextEntry
            onChangeText={handleChange("password")}
            onBlur={handleBlur("password")}
            value={values.password}
          />
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

          <TouchableOpacity onPress={() => router.push("RegisterForm")}>
            <Text style={[styles.switchText, dynamicStyles.switchText]}>
              Don't have an account? Create Account
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Formik>
  );
}