import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { PRIMARY_BLUE, PRIMARY_DARK_BLUE, COLORS } from "../constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const { ALERT_INFO_BG } = COLORS;

const AlertModal = memo(
  ({ visible, title, message, type = "info", onClose, actions = [] }) => {
    const scaleValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      if (visible) {
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();
      } else {
        scaleValue.setValue(0);
      }
    }, [visible]);

    const getIconConfig = () => {
      switch (type) {
        case "success":
          return { name: "check-circle", color: COLORS.SUCCESS, bgColor: COLORS.ALERT_SUCCESS_BG };
        case "error":
          return { name: "error", color: COLORS.ERROR, bgColor: COLORS.ALERT_ERROR_BG };
        case "warning":
          return { name: "warning", color: COLORS.WARNING, bgColor: COLORS.ALERT_WARNING_BG };
        case "info":
        default:
          return { name: "info", color: PRIMARY_BLUE, bgColor: ALERT_INFO_BG };
      }
    };

    const iconConfig = getIconConfig();

    // Default actions if none provided
    const defaultActions =
      actions.length > 0
        ? actions
        : [{ text: "OK", onPress: onClose, primary: true }];

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ scale: scaleValue }],
              },
            ]}
          >
            {/* Icon */}
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: iconConfig.bgColor },
              ]}
            >
              <MaterialIcons
                name={iconConfig.name}
                size={48}
                color={iconConfig.color}
              />
            </View>

            {/* Title */}
            {title && <Text style={styles.title}>{title}</Text>}

            {/* Message */}
            {message && <Text style={styles.message}>{message}</Text>}

            {/* Actions */}
            <View style={styles.actionsContainer}>
              {defaultActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.actionButton}
                  onPress={() => {
                    action.onPress?.();
                    if (!action.keepOpen) {
                      onClose();
                    }
                  }}
                >
                  <LinearGradient
                    colors={
                      action.primary
                        ? [PRIMARY_BLUE, PRIMARY_DARK_BLUE]
                        : action.destructive
                          ? ["#ef4444", "#dc2626"]
                          : ["#9ca3af", "#6b7280"]
                    }
                    style={styles.actionButtonGradient}
                  >
                    <Text style={styles.actionButtonText}>{action.text}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
    fontFamily: "Roboto",
  },
  message: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    fontFamily: "Roboto",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Roboto",
  },
});

export default AlertModal;
