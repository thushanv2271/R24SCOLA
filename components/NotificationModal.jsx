import React, { useContext, memo, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  SectionList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "./AuthContext";
import { useTheme } from "./ThemeContext";
import { LanguageContext } from "./LanguageContext";

const ICON_MAP = {
  login: "person-circle",
  scholarship: "school",
  deadline: "alarm",
  application: "document-text",
  info: "information-circle",
  coins: "wallet",
  welcome: "gift",
};

const COLOR_MAP = {
  coins: "#d97706",
  welcome: "#d97706",
  login: "#004aad",
  scholarship: "#004aad",
  deadline: "#f59e0b",
  application: "#8b5cf6",
  info: "#64748b",
};

const getTimeAgo = (timestamp) => {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

const NotificationItem = memo(({ item, onDismiss }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const color = COLOR_MAP[item.type] ?? "#64748b";
  const icon = ICON_MAP[item.type] ?? "notifications";
  return (
    <View style={styles.item}>
      <View style={[styles.iconWrap, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.itemBody}>
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description ? (
          <Text style={styles.itemDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.itemTimeRow}>
          <Ionicons name="time-outline" size={11} color={colors.textMuted} />
          <Text style={styles.itemTime}>{getTimeAgo(item.timestamp)}</Text>
        </View>
      </View>
      {onDismiss ? (
        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={() => onDismiss(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Dismiss notification"
        >
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

const NotificationModal = memo(({ visible, onClose }) => {
  const { notifications, clearNotifications, removeNotification } =
    useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const count = notifications?.length ?? 0;

  // Group into Today / Earlier so a long history stays scannable.
  const sections = useMemo(() => {
    if (!count) return [];
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const today = [];
    const earlier = [];
    notifications.forEach((n) => {
      (new Date(n.timestamp) >= startOfToday ? today : earlier).push(n);
    });
    return [
      ...(today.length ? [{ title: t("alerts.today"), data: today }] : []),
      ...(earlier.length ? [{ title: t("alerts.earlier"), data: earlier }] : []),
    ];
  }, [notifications, count, t]);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.sheet}>
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconWrap}>
              <Ionicons name="notifications" size={18} color={colors.accent} />
            </View>
            <Text style={styles.headerTitle}>Notifications</Text>
            {count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{count}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            {count > 0 && (
              <TouchableOpacity hitSlop={{ top: 9, bottom: 9, left: 6, right: 6 }}
                style={styles.clearBtn}
                onPress={clearNotifications}
                activeOpacity={0.75}
              >
                <Ionicons name="trash-outline" size={15} color={colors.danger} />
                <Text style={styles.clearBtnText}>Clear all</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.75}
              accessibilityLabel="Close notifications"
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* List */}
        {count === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name="notifications-off-outline"
                size={40}
                color={colors.textMuted}
              />
            </View>
            <Text style={styles.emptyTitle}>You're all caught up</Text>
            <Text style={styles.emptyDesc}>
              No new notifications right now. Updates about scholarships,
              deadlines and your account will show up here.
            </Text>
          </View>
        ) : (
          <SectionList
            style={{ flexGrow: 0 }}
            sections={sections}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <NotificationItem item={item} onDismiss={removeNotification} />
            )}
            renderSectionHeader={({ section }) => (
              <Text style={styles.sectionLabel}>{section.title}</Text>
            )}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </Modal>
  );
});

const createStyles = (colors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceAlt,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "75%",
    minHeight: "42%",
    paddingBottom: 28,
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentLight,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    fontFamily: "Roboto",
  },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.dangerLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.danger,
    fontFamily: "Roboto",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: 20,
    marginBottom: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: colors.textMuted,
    marginTop: 10,
    marginBottom: 4,
    marginLeft: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    fontFamily: "Roboto",
    marginBottom: 3,
    textBreakStrategy: "simple",
  },
  itemDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: "Roboto",
    lineHeight: 18,
    textBreakStrategy: "simple",
  },
  itemTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 5,
  },
  itemTime: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: "Roboto",
  },
  dismissBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    flexShrink: 0,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    fontFamily: "Roboto",
    marginBottom: 6,
    textBreakStrategy: "simple",
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: "Roboto",
    textAlign: "center",
    lineHeight: 19,
    textBreakStrategy: "simple",
  },
});

export default NotificationModal;
