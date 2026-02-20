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
import { styles, getDynamicStyles } from "../app/styles/styles3";
import LoaderModal from '../components/LoaderModal';
import { authAPI } from "../services/apiService";

const RegisterSchema = Yup.object().shape({
  email: Yup.string().required("Required"), 
  password: Yup.string().required("Required  ").min(6, "Too short   "),
  confirmPassword: Yup.string()
    .required("Required  ")
    .oneOf([Yup.ref("password"), null], "Passwords must match   "),
});

export default function RegisterForm() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const dynamicStyles = getDynamicStyles(colorScheme);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleRegister = async (values, { setFieldError }) => {
    try {
      // Check if user already exists
      try {
        await authAPI.checkUserExists(values.email);
        setFieldError("email", "username already in use");
        return;
      } catch (error) {
        // Expected to fail (user doesn't exist), continue with registration
        if (!error.message.includes('404')) {
          throw error;
        }
      }

      // Register new user
      await authAPI.register({
        id: "",
        email: values.email,
        password: values.password,
        age: 25,
        country: "United States",
        favoriteScholarshipIds: [],
      });

      setIsModalVisible(true);
      
      setTimeout(() => {
        router.push("login");
        setIsModalVisible(false);
      }, 3000);
    } catch (error) {
      alert(error.message || "Registration failed");
    }
  };

  return (
    <Formik
      initialValues={{
        email: "",
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
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer}>
          <View style={[styles.container, dynamicStyles.container]}>
            <Image
              source={require("../assets/images/OPPORTUNITIES.png")}
              style={styles.logo}
            />
            <Text style={[styles.title, dynamicStyles.title]}>  Create Account   </Text>

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

            <TextInput
              style={[styles.input, dynamicStyles.input]}
              placeholder="Confirm Password"
              secureTextEntry
              onChangeText={handleChange("confirmPassword")}
              onBlur={handleBlur("confirmPassword")}
              value={values.confirmPassword}
            />
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