import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import LoaderModal from "../components/ui/LoaderModal";
import KeyboardSafe from "../components/blocks/KeyboardSafe";
import AlertModal from "../components/AlertModal";
import Avatar from "../components/ui/Avatar";
import { AuthContext } from "../components/AuthContext";
import { LanguageContext } from "../components/LanguageContext";
import { useTheme } from "../components/ThemeContext";
import { playSound } from "../utils/feedback";
import { haptic } from "../components/ui/motion";
import { chatAPI, avatarPhotoUrl } from "../services/apiService";

const POLL_INTERVAL_MS = 3000;

const formatTime = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

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

// Sent = the server has the message. Read = the other person has opened the
// chat since it was sent (derived from otherUserReadAt, not the message's own
// stale `read` flag, so already-rendered bubbles update live as new polls land).
const MessageTicks = ({ isRead }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Ionicons
      name={isRead ? "checkmark-done" : "checkmark"}
      size={14}
      color={isRead ? "#7dd3fc" : "rgba(255,255,255,0.75)"}
      style={styles.bubbleTick}
    />
  );
};

const MessageBubble = ({ message, isMine, isRead, onLongPress }) => {
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  if (message.deleted) {
    return (
      <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
        <View style={[styles.bubble, styles.bubbleDeleted]}>
          <Ionicons name="ban-outline" size={13} color={colors.textMuted} />
          <Text style={styles.bubbleDeletedText}>{t("chat.messageDeleted")}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
      <TouchableOpacity
        activeOpacity={0.85}
        delayLongPress={280}
        onLongPress={() => isMine && onLongPress(message)}
        style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}
      >
        <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{message.text}</Text>
        <View style={styles.bubbleMetaRow}>
          {!!message.editedAt && (
            <Text style={[styles.bubbleEdited, isMine && styles.bubbleTimeMine]}>{t("chat.edited")} · </Text>
          )}
          <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
            {formatTime(message.createdAt)}
          </Text>
          {isMine && <MessageTicks isRead={isRead} />}
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default function ChatScreen() {
  const { username: otherUsername } = useLocalSearchParams();
  const { user } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [otherUserReadAt, setOtherUserReadAt] = useState(null);
  const [otherUserPresence, setOtherUserPresence] = useState({
    avatarIcon: null,
    avatarColor: null,
    photoVersion: null,
    isOnline: false,
    lastActiveAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [actionSheetMessage, setActionSheetMessage] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const listRef = useRef(null);
  const latestTimestampRef = useRef(null);
  const pollRef = useRef(null);
  const isFocusedRef = useRef(true);
  const meRef = useRef(user?.username);
  meRef.current = user?.username;

  const fetchNewMessages = useCallback(async (convId, since) => {
    try {
      const data = await chatAPI.getMessages(convId, since);
      if (data?.otherUserReadAt) setOtherUserReadAt(data.otherUserReadAt);
      setOtherUserPresence({
        avatarIcon: data?.otherUserAvatarIcon ?? null,
        avatarColor: data?.otherUserAvatarColor ?? null,
        photoVersion: data?.otherUserAvatarPhotoVersion ?? null,
        isOnline: !!data?.otherUserIsOnline,
        lastActiveAt: data?.otherUserLastActiveAt ?? null,
      });

      const incoming = data?.messages || [];
      if (incoming.length === 0) return;
      if (incoming.some((m) => m.senderUsername !== meRef.current)) playSound("receive");

      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        const merged = [...prev, ...incoming.filter((m) => !seen.has(m.id))];
        return merged;
      });
      const last = incoming[incoming.length - 1];
      if (last?.createdAt) latestTimestampRef.current = last.createdAt;
    } catch (error) {
      console.error("Error polling messages:", error);
    }
  }, []);

  const init = useCallback(async () => {
    if (!otherUsername) return;
    setLoading(true);
    try {
      const conversation = await chatAPI.startConversation(otherUsername);
      setConversationId(conversation.id);
      setOtherUserPresence({
        avatarIcon: conversation.otherUserAvatarIcon ?? null,
        avatarColor: conversation.otherUserAvatarColor ?? null,
        photoVersion: conversation.otherUserAvatarPhotoVersion ?? null,
        isOnline: !!conversation.otherUserIsOnline,
        lastActiveAt: conversation.otherUserLastActiveAt ?? null,
      });
      const data = await chatAPI.getMessages(conversation.id, null);
      const initial = data?.messages || [];
      setMessages(initial);
      if (data?.otherUserReadAt) setOtherUserReadAt(data.otherUserReadAt);
      if (data) {
        setOtherUserPresence({
          avatarIcon: data.otherUserAvatarIcon ?? null,
          avatarColor: data.otherUserAvatarColor ?? null,
          photoVersion: data.otherUserAvatarPhotoVersion ?? null,
          isOnline: !!data.otherUserIsOnline,
          lastActiveAt: data.otherUserLastActiveAt ?? null,
        });
      }
      const last = initial[initial.length - 1];
      latestTimestampRef.current = last?.createdAt || null;
    } catch (error) {
      console.error("Error starting conversation:", error);
    } finally {
      setLoading(false);
    }
  }, [otherUsername]);

  useEffect(() => {
    init();
  }, [init]);

  // Poll for new messages while this screen is focused; stop the moment it
  // isn't, so background screens never burn requests.
  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      return () => {
        isFocusedRef.current = false;
      };
    }, []),
  );

  useEffect(() => {
    if (!conversationId) return undefined;

    pollRef.current = setInterval(() => {
      if (!isFocusedRef.current || AppState.currentState !== "active") return;
      fetchNewMessages(conversationId, latestTimestampRef.current);
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [conversationId, fetchNewMessages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !conversationId || sending) return;

    if (editingMessage) {
      setSending(true);
      try {
        const updated = await chatAPI.editMessage(conversationId, editingMessage.id, text);
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        setEditingMessage(null);
        setInputText("");
      } catch (error) {
        console.error("Error editing message:", error);
      } finally {
        setSending(false);
      }
      return;
    }

    setInputText("");
    setSending(true);
    try {
      const message = await chatAPI.sendMessage(conversationId, text);
      setMessages((prev) => [...prev, message]);
      latestTimestampRef.current = message.createdAt;
      playSound("send");
      haptic("light");
    } catch (error) {
      console.error("Error sending message:", error);
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const startEdit = (message) => {
    setActionSheetMessage(null);
    setEditingMessage(message);
    setInputText(message.text);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setInputText("");
  };

  const requestDelete = (message) => {
    setActionSheetMessage(null);
    setConfirmDeleteId(message.id);
  };

  const confirmDelete = async () => {
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    if (!id || !conversationId) return;
    try {
      await chatAPI.deleteMessage(conversationId, id);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, deleted: true, text: "" } : m)),
      );
      if (editingMessage?.id === id) cancelEdit();
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* A custom header instead of the shared ScreenHeader here — that
          component's layout is a single centered title/logo slot, which has
          no room for an avatar + a second status line under the name. This
          previously showed only the plain "@username" text with nothing
          else, unlike a normal 1:1 chat header (WhatsApp, etc.) which always
          shows the other person's picture, name, and online/last-seen. */}
      <View style={styles.chatHeader}>
        <TouchableOpacity hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
          style={styles.headerBackButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerAvatarWrap}>
          <Avatar
            name={otherUsername}
            icon={otherUserPresence.avatarIcon}
            color={otherUserPresence.avatarColor}
            photoUri={avatarPhotoUrl(otherUsername, otherUserPresence.photoVersion)}
            size={40}
            borderWidth={0}
          />
          {otherUserPresence.isOnline && <View style={styles.headerOnlineDot} />}
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerName} numberOfLines={1}>
            @{otherUsername || ""}
          </Text>
          <Text
            style={[
              styles.headerStatus,
              otherUserPresence.isOnline && styles.headerStatusOnline,
            ]}
            numberOfLines={1}
          >
            {otherUserPresence.isOnline
              ? t("chat.online")
              : otherUserPresence.lastActiveAt
                ? `${t("chat.lastSeen")} ${formatRelativeDate(otherUserPresence.lastActiveAt)}`
                : ""}
          </Text>
        </View>
      </View>

      <KeyboardSafe>
        {loading ? (
          <LoaderModal />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isMine={item.senderUsername === user?.username}
                isRead={!!otherUserReadAt && new Date(item.createdAt) <= new Date(otherUserReadAt)}
                onLongPress={setActionSheetMessage}
              />
            )}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Avatar
                  name={otherUsername}
                  icon={otherUserPresence.avatarIcon}
                  color={otherUserPresence.avatarColor}
                  photoUri={avatarPhotoUrl(otherUsername, otherUserPresence.photoVersion)}
                  size={56}
                />
                <Text style={styles.emptyStateTitle}>{t("chat.startConversation")}</Text>
                <Text style={styles.emptyStateSubtitle}>
                  {t("chat.sayHello")} @{otherUsername}
                </Text>
              </View>
            }
          />
        )}

        {editingMessage && (
          <View style={styles.editingBar}>
            <Ionicons name="pencil" size={14} color={colors.accent} />
            <Text style={styles.editingBarText} numberOfLines={1}>
              {t("chat.editingMessage")}
            </Text>
            <TouchableOpacity onPress={cancelEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t("chat.messagePlaceholder")}
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <TouchableOpacity hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
            style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            <Ionicons name={editingMessage ? "checkmark" : "send"} size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardSafe>

      <Modal
        visible={!!actionSheetMessage}
        transparent
        animationType="fade"
        onRequestClose={() => setActionSheetMessage(null)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setActionSheetMessage(null)}>
          <View style={styles.sheet}>
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => actionSheetMessage && startEdit(actionSheetMessage)}
            >
              <Ionicons name="pencil-outline" size={18} color={colors.textPrimary} />
              <Text style={styles.sheetOptionText}>{t("common.edit")}</Text>
            </TouchableOpacity>
            <View style={styles.sheetDivider} />
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => actionSheetMessage && requestDelete(actionSheetMessage)}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={[styles.sheetOptionText, styles.sheetOptionTextDanger]}>{t("common.delete")}</Text>
            </TouchableOpacity>
            <View style={styles.sheetDivider} />
            <TouchableOpacity style={styles.sheetOption} onPress={() => setActionSheetMessage(null)}>
              <Text style={styles.sheetCancelText}>{t("common.cancel")}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <AlertModal
        visible={!!confirmDeleteId}
        title={t("chat.deleteMessageTitle")}
        message={t("chat.deleteMessageWarning")}
        type="warning"
        actions={[
          { text: t("common.cancel"), onPress: () => setConfirmDeleteId(null), secondary: true },
          { text: t("common.delete"), onPress: confirmDelete, destructive: true },
        ]}
        onClose={() => setConfirmDeleteId(null)}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: 10,
  },
  headerBackButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerAvatarWrap: {
    position: "relative",
  },
  headerOnlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerName: {
    fontSize: 15.5,
    fontWeight: "700",
    color: colors.textPrimary,
    fontFamily: "Roboto",
  },
  headerStatus: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: "Roboto",
    marginTop: 1,
  },
  headerStatusOnline: {
    color: colors.success,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  bubbleRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  bubbleRowMine: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  bubbleMine: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  bubbleDeleted: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 18,
  },
  bubbleDeletedText: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: "Roboto",
    fontStyle: "italic",
  },
  bubbleText: {
    fontSize: 14.5,
    color: colors.textPrimary,
    fontFamily: "Roboto",
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: "#fff",
  },
  bubbleMetaRow: {
    flexDirection: "row",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  bubbleEdited: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: "Roboto",
    fontStyle: "italic",
  },
  bubbleTime: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: "Roboto",
  },
  bubbleTimeMine: {
    color: "rgba(255,255,255,0.75)",
  },
  bubbleTick: {
    marginLeft: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 6,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textSecondary,
    fontFamily: "Roboto",
    marginTop: 10,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: "Roboto",
  },
  editingBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.accentLight,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  editingBarText: {
    flex: 1,
    fontSize: 12.5,
    color: colors.accent,
    fontFamily: "Roboto",
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 14,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: "Roboto",
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
    paddingTop: 8,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 22,
  },
  sheetOptionText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: "Roboto",
    fontWeight: "600",
  },
  sheetOptionTextDanger: {
    color: colors.danger,
  },
  sheetCancelText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontFamily: "Roboto",
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },
});
