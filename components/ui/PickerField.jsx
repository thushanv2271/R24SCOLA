import React, { useContext, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LanguageContext } from "../LanguageContext";
import { useTheme } from "../ThemeContext";

// A dropdown: a field that opens a bottom sheet of options (optionally
// searchable). Options are { value, label, flag? }.
const PickerField = ({
  value,
  options,
  onChange,
  placeholder,
  title,
  searchable = false,
  invalid = false,
  leadingIcon,
}) => {
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.field,
          { backgroundColor: colors.surfaceAlt, borderColor: invalid ? colors.danger || "#dc2626" : "transparent" },
        ]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityValue={{ text: selected?.label || placeholder }}
      >
        {selected?.flag ? <Text style={styles.flag}>{selected.flag}</Text> : leadingIcon}
        <Text
          style={[styles.fieldText, { color: selected ? colors.textPrimary : colors.textMuted }]}
          numberOfLines={1}
        >
          {selected?.label || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
        <KeyboardAvoidingView style={styles.fill} behavior="padding">
          <Pressable style={styles.backdrop} onPress={close} accessibilityLabel={t("common.cancel")} />
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHead}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {title}
              </Text>
              <TouchableOpacity
                onPress={close}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel={t("common.cancel")}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {searchable && (
              <View style={[styles.search, { backgroundColor: colors.surfaceAlt }]}>
                <Ionicons name="search" size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: colors.textPrimary }]}
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t("common.search")}
                  placeholderTextColor={colors.textMuted}
                  autoCorrect={false}
                />
              </View>
            )}

            <FlatList
              data={visible}
              keyExtractor={(o) => o.value}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={14}
              ListEmptyComponent={
                <Text style={[styles.empty, { color: colors.textSecondary }]}>
                  {t("personalDetails.noResults")}
                </Text>
              }
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    style={[styles.option, isSelected && { backgroundColor: colors.accentLight }]}
                    onPress={() => {
                      onChange(item.value);
                      close();
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    {item.flag ? <Text style={styles.flag}>{item.flag}</Text> : null}
                    <Text
                      style={[
                        styles.optionText,
                        { color: isSelected ? colors.accent : colors.textPrimary },
                        isSelected && { fontWeight: "700" },
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={colors.accent} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  field: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fieldText: { flex: 1, fontSize: 16, fontFamily: "Roboto" },
  flag: { fontSize: 20 },
  sheet: {
    maxHeight: "78%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginTop: 10 },
  sheetHead: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  sheetTitle: { flex: 1, fontSize: 18, fontWeight: "800", fontFamily: "Roboto" },
  closeBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginRight: -10 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchInput: { flex: 1, minHeight: 46, fontSize: 15, fontFamily: "Roboto" },
  option: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  optionText: { flex: 1, fontSize: 15.5, fontFamily: "Roboto" },
  empty: { textAlign: "center", paddingVertical: 28, fontSize: 14, fontFamily: "Roboto" },
});

export default PickerField;
