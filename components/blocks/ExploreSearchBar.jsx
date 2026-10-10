import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Keyboard, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { matchRange } from "../../utils/listingSearch";

const ICONS = {
  University: "school-outline",
  Major: "book-outline",
  Company: "business-outline",
  Role: "briefcase-outline",
};

const Suggestion = ({ text, query, style, color, accent }) => {
  const range = matchRange(text, query);
  if (!range) return <Text style={style} numberOfLines={1}>{text}</Text>;
  return (
    <Text style={style} numberOfLines={1}>
      {text.slice(0, range[0])}
      <Text style={{ fontWeight: "800", color: accent }}>{text.slice(range[0], range[1])}</Text>
      {text.slice(range[1])}
    </Text>
  );
};

// Search box + suggestion dropdown for Explore. It sits in the fixed part of
// the screen (above the swipeable pages); each page supplies its own query
// value and suggestion list.
const ExploreSearchBar = ({ value, onChangeText, placeholder, suggestions = [] }) => {
  const { colors } = useTheme();
  const inputRef = useRef(null);
  const blurTimer = useRef(null);
  const [focused, setFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => () => clearTimeout(blurTimer.current), []);

  const handleChange = (text) => {
    onChangeText(text);
    setShowSuggestions(text.trim().length >= 2);
  };

  const handleFocus = () => {
    setFocused(true);
    clearTimeout(blurTimer.current);
    if (value.trim().length >= 2) setShowSuggestions(true);
  };

  const handleBlur = () => {
    setFocused(false);
    blurTimer.current = setTimeout(() => setShowSuggestions(false), 150);
  };

  const submit = () => {
    clearTimeout(blurTimer.current);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const select = (text) => {
    clearTimeout(blurTimer.current);
    onChangeText(text);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  return (
    <View>
      <View
        style={[
          styles.bar,
          { backgroundColor: colors.surface, borderColor: colors.border },
          focused && { borderColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 },
        ]}
      >
        <TouchableOpacity
          onPress={() => inputRef.current?.focus()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
          accessibilityLabel="Focus search"
        >
          <Ionicons name="search" size={19} color={focused ? colors.accent : colors.textMuted} />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
          onSubmitEditing={submit}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {!!value && (
          <TouchableOpacity
            onPress={() => {
              onChangeText("");
              setShowSuggestions(false);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={[styles.box, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {suggestions.map((item, index) => (
            <TouchableOpacity
              key={`${item.type}-${item.value}-${index}`}
              style={[
                styles.row,
                { borderBottomColor: colors.divider },
                index === suggestions.length - 1 && styles.rowLast,
              ]}
              activeOpacity={0.7}
              onPress={() => select(item.value)}
            >
              <Ionicons name={ICONS[item.type] || "flag-outline"} size={16} color={colors.textMuted} />
              <Suggestion
                text={item.value}
                query={value}
                style={[styles.text, { color: colors.textPrimary }]}
                accent={colors.accent}
              />
              <Text style={[styles.type, { color: colors.textMuted }]}>{item.type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    gap: 10,
    marginTop: 12,
    borderWidth: 1.5,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Roboto",
    paddingVertical: 0,
  },
  box: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 4,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  row: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  rowLast: { borderBottomWidth: 0 },
  text: { flex: 1, fontSize: 13.5, fontFamily: "Roboto" },
  type: { fontSize: 12, fontFamily: "Roboto", fontWeight: "600" },
});

export default ExploreSearchBar;
