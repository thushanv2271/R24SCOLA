import React, { useContext, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "./AuthContext";

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = width * 0.75;
const ANIM_DURATION = 280;

const MENU_SECTIONS = [
  {
    title: "Main",
    data: [
      { title: "Home", icon: "home", screen: "index" },
      { title: "Profile", icon: "person", screen: "Profile" },
    ],
  },
  {
    title: "Opportunities",
    data: [
      { title: "Scholarships", icon: "school", screen: "Scholarships" },
      { title: "Jobs", icon: "briefcase", screen: "Itjobs" },
      { title: "Favourites", icon: "heart", screen: "favourites" },
    ],
  },
  {
    title: "Tools",
    data: [
      {
        title: "Check Your Eligibility",
        icon: "checkmark-circle",
        screen: "ScholarshipCalculator",
      },
      { title: "Edit Mail", icon: "create", screen: "CustomMail" },
    ],
  },
];

const ScolaMenu = ({ visible, onClose }) => {
  const router = useRouter();
  const { logout, user } = useContext(AuthContext);
  const [modalVisible, setModalVisible] = useState(visible);
  const [username, setUsername] = useState(user?.username || "");
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
      return;
    }
    AsyncStorage.getItem("username").then((stored) => {
      if (stored) setUsername(stored);
    });
  }, [user]);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }).start(() => setModalVisible(false));
    }
  }, [visible]);

  const navigateTo = (item) => {
    onClose();
    router.push({
      pathname: item.screen === "index" ? "/" : `/${item.screen}`,
      params: item.screen === "Profile" ? { username } : {},
    });
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace("/login");
  };

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.sidebar,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <View style={styles.sidebarHeader}>
            <View style={styles.logoBadge}>
              <Image
                source={require("../assets/images/OPPORTUNITIES.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
          <SectionList
            sections={MENU_SECTIONS}
            keyExtractor={(item) => item.title}
            contentContainerStyle={styles.sidebarContent}
            stickySectionHeadersEnabled={false}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={styles.sectionHeader}>{title}</Text>
            )}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.sidebarItem}
                onPress={() => navigateTo(item)}
              >
                <Ionicons name={item.icon} size={24} color="#fff" />
                <Text style={styles.sidebarItemText}>{item.title}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <Text style={styles.sidebarItemText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#004aad",
    paddingTop: StatusBar.currentHeight || 50,
  },
  sidebarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
  },
  logoBadge: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  logo: {
    width: 120,
    height: 32,
  },
  sidebarContent: {
    padding: 16,
    paddingBottom: 90,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sidebarItemText: {
    fontSize: 16,
    color: "#fff",
    marginLeft: 16,
    fontFamily: "Roboto",
    fontWeight: "500",
  },
  logoutItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
});

export default ScolaMenu;
