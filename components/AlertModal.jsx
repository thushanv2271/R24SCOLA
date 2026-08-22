import React, { memo, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { PRIMARY_BLUE, PRIMARY_DARK_BLUE, COLORS } from "../constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const AlertModal = memo(
  ({ visible, title, message, type = "info", onClose, actions = [] }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.88)).current;
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
      if (visible) {
        setModalVisible(true);
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            damping: 14,
            stiffness: 180,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.88,
            duration: 160,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setModalVisible(false);
        });
      }
    }, [visible]);

    const getIconConfig = () => {
      switch (type) {
        case "success":
          return { name: "check-circle", color: "#10b981", bgColor: "#d1fae5" };
        case "error":
          return { name: "error", color: "#ef4444", bgColor: "#fee2e2" };
        case "warning":
          return { name: "warning", color: "#f59e0b", bgColor: "#fef3c7" };
        default:
          return { name: "info", color: PRIMARY_BLUE, bgColor: "#dbeafe" };
      }
    };

    const getButtonColor = (action) => {
      if (action.destructive) return "#ef4444";
      if (action.secondary) return "#64748b";
      return PRIMARY_BLUE;
    };

    const iconConfig = getIconConfig();
    const defaultActions =
      actions.length > 0
        ? actions
        : [{ text: "OK", onPress: onClose, primary: true }];

    return (
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={onClose}
      >
        <Animated.View style={[styles.overlay, { opacity }]}>
          <Animated.View
            style={[styles.card, { transform: [{ scale }] }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: iconConfig.bgColor }]}>
              <MaterialIcons name={iconConfig.name} size={36} color={iconConfig.color} />
            </View>

            {title ? <Text style={styles.title}>{title}</Text> : null}
            {message ? <Text style={styles.message}>{message}</Text> : null}

            <View style={styles.actions}>
              {defaultActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.btn, { backgroundColor: getButtonColor(action) }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    action.onPress?.();
                    if (!action.keepOpen) onClose();
                  }}
                >
                  <Text style={styles.btnText}>{action.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    fontFamily: "Roboto",
    marginBottom: 6,
    textBreakStrategy: "simple",
  },
  message: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 21,
    fontFamily: "Roboto",
    marginBottom: 22,
    textBreakStrategy: "simple",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
});

export default AlertModal;
