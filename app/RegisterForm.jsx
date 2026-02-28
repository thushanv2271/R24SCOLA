import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import * as Yup from "yup";
import { styles, getDynamicStyles } from "../app/styles/Styles3";
import LoaderModal from "../components/LoaderModal";
import { authAPI } from "../services/apiService";
import { IconSymbol } from "../components/ui/IconSymbol";

const RegisterSchema = Yup.object().shape({
  username: Yup.string()
    .trim()
    .matches(/^[a-zA-Z0-9_]{3,20}$/, "Username must be 3-20 characters")
    .required("Username is required"),
  password: Yup.string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
  confirmPassword: Yup.string()
    .required("Confirm your password")
    .oneOf([Yup.ref("password"), null], "Passwords must match"),
});

export default function RegisterForm() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const dynamicStyles = getDynamicStyles(colorScheme);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (values, { setFieldError }) => {
    try {
      const normalizedUsername = values.username.trim().toLowerCase();

      try {
        const existingUser = await authAPI.checkUserExists(normalizedUsername);
        if (existingUser) {
          setFieldError("username", "Username already in use");
          return;
        }
      } catch (error) {
        // 404 means user doesn't exist, which is what we want for registration
        if (error.status !== 404) {
          throw error;
        }
      }

      // Register new user
      await authAPI.register({
        id: "",
        username: normalizedUsername,
        password: values.password,
        age: 25,
        country: "United States",
        favoriteScholarshipIds: [],
        favoriteJobIds: [],
      });

      setIsModalVisible(true);

      setTimeout(() => {
        router.push("/login");
        setIsModalVisible(false);
      }, 3000);
    } catch (error) {
      // Handle duplicate email error from backend
      const errorMsg = error.message || "Registration failed";
      if (
        errorMsg.toLowerCase().includes("already exists") ||
        errorMsg.toLowerCase().includes("already in use")
      ) {
        setFieldError("username", "Username already in use");
      } else if (errorMsg.toLowerCase().includes("required")) {
        alert("Username and password are required");
      } else {
        alert(
          errorMsg.replace(
            /^HTTP \d+$/,
            "Registration failed. Please try again.",
          ),
        );
      }
    }
  };

  return (
    <Formik
      initialValues={{
        username: "",
        password: "",
        confirmPassword: "",
      }}
      validationSchema={RegisterSchema}
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
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={[styles.container, dynamicStyles.container]}>
            <Image
              source={require("../assets/images/OPPORTUNITIES.png")}
              style={styles.logo}
            />
            <Text style={[styles.title, dynamicStyles.title]}>
              {" "}
              Create Account{" "}
            </Text>

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
                style={[
                  styles.input,
                  dynamicStyles.input,
                  styles.passwordInput,
                ]}
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

            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  dynamicStyles.input,
                  styles.passwordInput,
                ]}
                placeholder="Confirm Password"
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
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                <IconSymbol
                  name={showConfirmPassword ? "eye.slash.fill" : "eye.fill"}
                  size={22}
                  color="#333"
                />
              </TouchableOpacity>
            </View>
            {touched.confirmPassword && errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Create Account </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={[styles.switchText, dynamicStyles.switchText]}>
                Already have an account? Login
              </Text>
            </TouchableOpacity>
            <LoaderModal visible={isModalVisible} />
          </View>
        </ScrollView>
      )}
    </Formik>
  );
}
