import React, { useCallback, useContext, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import RefreshControl from "../../components/ui/AppRefreshControl";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import ScreenHeader from "../../components/blocks/ScreenHeader";
import LoaderModal from "../../components/ui/LoaderModal";
import Avatar from "../../components/ui/Avatar";
import ScolaMenu from "../../components/ScolaMenu";
import AlertModal from "../../components/AlertModal";
import { chatAPI, avatarPhotoUrl } from "../../services/apiService";
import { LanguageContext } from "../../components/LanguageContext";
import { useTheme } from "../../components/ThemeContext";

const formatRelativeDate = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const ConversationRow = ({ conversation, onPress }) => {
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isOnline = conversation.otherUserIsOnline;

  // No message yet is otherwise a wasted line ("Say hello 👋" on every empty
  // conversation) — showing online/last-seen status there instead is more
  // useful, same as WhatsApp/Telegram do for a chat with no history yet.
  // Once there's an actual last message, that always takes priority.
  let previewText = conversation.lastMessage;
  let previewIsStatus = false;
  if (!previewText) {
    if (isOnline) {
      previewText = t("chat.online");
      previewIsStatus = true;
    } else if (conversation.otherUserLastActiveAt) {
      previewText = `${t("chat.lastSeen")} ${formatRelativeDate(conversation.otherUserLastActiveAt)}`;
      previewIsStatus = true;
    } else {
      previewText = t("chat.sayHelloWave");
    }
  }

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.75} onPress={onPress}>
      <View style={styles.avatarWrap}>
        <Avatar
          name={conversation.otherUsername}
          icon={conversation.otherUserAvatarIcon}
          color={conversation.otherUserAvatarColor}
          photoUri={avatarPhotoUrl(conversation.otherUsername, conversation.otherUserAvatarPhotoVersion)}
          size={48}
        />
        {isOnline && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowName} numberOfLines={1}>
            @{conversation.otherUsername}
          </Text>
          <Text style={styles.rowTime}>{formatRelativeDate(conversation.lastMessageAt)}</Text>
        </View>
        <View style={styles.rowFooter}>
          <Text
            style={[
              styles.rowPreview,
              conversation.unreadCount > 0 && styles.rowPreviewUnread,
              previewIsStatus && (isOnline ? styles.rowPreviewOnline : styles.rowPreviewLastSeen),
            ]}
            numberOfLines={1}
          >
            {previewText}
          </Text>
          {conversation.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function ChatsScreen() {
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [offlineAlertVisible, setOfflineAlertVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await chatAPI.getConversations();
      setConversations(data?.conversations || []);
    } catch (error) {
      console.error("Error loading conversations:", error);
      if (error?.isNetworkError) setOfflineAlertVisible(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <ScreenHeader onMenuPress={() => setMenuVisible(true)} />
        <View style={styles.pageTitleBlock}>
          <Text style={styles.pageTitle}>{t("chat.inboxTitle")}</Text>
          <Text style={styles.pageSubtitle}>{t("chat.inboxSubtitle")}</Text>
        </View>
      </View>
      <ScolaMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />

      {loading ? (
        <LoaderModal />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationRow
              conversation={item}
              onPress={() =>
                router.push({ pathname: "/Chat", params: { username: item.otherUsername } })
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={44} color={colors.textMuted} />
              <Text style={styles.emptyStateTitle}>{t("chat.noConversations")}</Text>
              <Text style={styles.emptyStateSubtitle}>{t("chat.noConversationsDesc")}</Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => router.push("/Community")}
              >
                <Text style={styles.emptyStateButtonText}>{t("chat.browseCommunity")}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      <AlertModal
        visible={offlineAlertVisible}
        title="No Internet Connection"
        message="Please check your internet connection and try again."
        type="warning"
        onClose={() => setOfflineAlertVisible(false)}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  headerContainer: {
    backgroundColor: colors.headerBackground,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  pageTitleBlock: {
    marginTop: 12,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    fontFamily: "Roboto",
    color: colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: 12.5,
    fontFamily: "Roboto",
    color: colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  avatarWrap: {
    position: "relative",
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  rowBody: {
    flex: 1,
    marginLeft: 12,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    fontFamily: "Roboto",
    flex: 1,
    marginRight: 8,
  },
  rowTime: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: "Roboto",
  },
  rowFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
  },
  rowPreview: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: "Roboto",
    flex: 1,
    marginRight: 8,
  },
  rowPreviewUnread: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  rowPreviewOnline: {
    color: colors.success,
    fontWeight: "600",
  },
  rowPreviewLastSeen: {
    color: colors.textMuted,
    fontStyle: "italic",
  },
  unreadBadge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 70,
    paddingHorizontal: 30,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textSecondary,
    fontFamily: "Roboto",
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: "Roboto",
    textAlign: "center",
  },
  emptyStateButton: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  emptyStateButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
});
