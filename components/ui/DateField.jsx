import React, { useContext, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LanguageContext, getLocale } from "../LanguageContext";
import { useTheme } from "../ThemeContext";

// Date-of-birth picker: a field that opens a calendar sheet. Tap the year to
// jump decades at once. Value is stored as "YYYY-MM-DD".

const EN_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const EN_WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const YEAR_ROW = 48;

const pad = (n) => String(n).padStart(2, "0");
const toValue = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

export const parseDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])];
  const date = new Date(y, m, d);
  if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d) return null;
  return { y, m, d };
};

export const formatDate = (value, language) => {
  const parsed = parseDate(value);
  if (!parsed) return value || "";
  try {
    return new Date(parsed.y, parsed.m, parsed.d).toLocaleDateString(language === "en" ? "en-GB" : getLocale(language), {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (e) {
    return value;
  }
};

const useNames = (language) =>
  useMemo(() => {
    const locale = getLocale(language);
    try {
      const month = new Intl.DateTimeFormat(locale, { month: "long" });
      const weekday = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
      const months = EN_MONTHS.map((_, i) => month.format(new Date(2021, i, 1)));
      // 2021-08-01 is a Sunday.
      const weekdays = EN_WEEKDAYS.map((_, i) => weekday.format(new Date(2021, 7, 1 + i)));
      if (months.some((m) => !m) || weekdays.some((w) => !w)) throw new Error("no intl");
      return { months, weekdays };
    } catch (e) {
      return { months: EN_MONTHS, weekdays: EN_WEEKDAYS };
    }
  }, [language]);

const DateField = ({ value, onChange, placeholder, title, invalid = false, minAge = 10, maxAge = 100 }) => {
  const { t, language } = useContext(LanguageContext);
  const { colors } = useTheme();
  const { months, weekdays } = useNames(language);
  const today = new Date();
  const maxYear = today.getFullYear() - minAge;
  const minYear = today.getFullYear() - maxAge;
  const current = parseDate(value);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("days");
  const [view, setView] = useState({ y: maxYear - 10, m: 0 });

  const openSheet = () => {
    setView(current ? { y: current.y, m: current.m } : { y: maxYear - 10, m: 0 });
    setMode("days");
    setOpen(true);
  };

  const years = useMemo(() => {
    const list = [];
    for (let y = maxYear; y >= minYear; y--) list.push(y);
    return list;
  }, [maxYear, minYear]);

  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const offset = new Date(view.y, view.m, 1).getDay();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const shiftMonth = (delta) => {
    let m = view.m + delta;
    let y = view.y;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    if (y > maxYear || y < minYear) return;
    setView({ y, m });
  };

  const pickDay = (d) => {
    const picked = new Date(view.y, view.m, d);
    const limit = new Date(maxYear, today.getMonth(), today.getDate());
    if (picked > limit) return;
    onChange(toValue(view.y, view.m, d));
    setOpen(false);
  };

  const label = current ? `${current.d} ${months[current.m]} ${current.y}` : null;
  const limit = new Date(maxYear, today.getMonth(), today.getDate());

  return (
    <>
      <TouchableOpacity
        style={[
          styles.field,
          { backgroundColor: colors.surfaceAlt, borderColor: invalid ? colors.danger : "transparent" },
        ]}
        onPress={openSheet}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityValue={{ text: label || placeholder }}
      >
        <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
        <Text style={[styles.fieldText, { color: label ? colors.textPrimary : colors.textMuted }]} numberOfLines={1}>
          {label || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <View style={styles.fill}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel={t("common.cancel")} />
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHead}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {title}
              </Text>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel={t("common.cancel")}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.monthRow}>
              <TouchableOpacity
                onPress={() => shiftMonth(-1)}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel={t("personalDetails.previousMonth")}
              >
                <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.monthLabel, { backgroundColor: colors.surfaceAlt }]}
                onPress={() => setMode(mode === "days" ? "years" : "days")}
                accessibilityRole="button"
                accessibilityLabel={t("personalDetails.chooseYear")}
              >
                <Text style={[styles.monthText, { color: colors.textPrimary }]}>
                  {months[view.m]} {view.y}
                </Text>
                <Ionicons name={mode === "days" ? "caret-down" : "caret-up"} size={12} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => shiftMonth(1)}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel={t("personalDetails.nextMonth")}
              >
                <Ionicons name="chevron-forward" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {mode === "years" ? (
              <FlatList
                style={styles.yearList}
                data={years}
                keyExtractor={(y) => String(y)}
                getItemLayout={(_, index) => ({ length: YEAR_ROW, offset: YEAR_ROW * index, index })}
                initialScrollIndex={Math.max(0, years.indexOf(view.y) - 2)}
                renderItem={({ item: y }) => {
                  const active = y === view.y;
                  return (
                    <TouchableOpacity
                      style={[styles.yearRow, active && { backgroundColor: colors.accentLight }]}
                      onPress={() => {
                        setView((v) => ({ ...v, y }));
                        setMode("days");
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.yearText, { color: active ? colors.accent : colors.textPrimary }, active && { fontWeight: "800" }]}>
                        {y}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            ) : (
              <View>
                <View style={styles.weekRow}>
                  {weekdays.map((w, i) => (
                    <Text key={i} style={[styles.weekday, { color: colors.textMuted }]}>
                      {w}
                    </Text>
                  ))}
                </View>
                <View style={styles.grid}>
                  {cells.map((d, i) => {
                    if (!d) return <View key={`b${i}`} style={styles.cell} />;
                    const disabled = new Date(view.y, view.m, d) > limit;
                    const selected = !!current && current.y === view.y && current.m === view.m && current.d === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        style={styles.cell}
                        onPress={() => pickDay(d)}
                        disabled={disabled}
                        accessibilityRole="button"
                        accessibilityState={{ selected, disabled }}
                        accessibilityLabel={`${d} ${months[view.m]} ${view.y}`}
                      >
                        <View style={[styles.day, selected && { backgroundColor: colors.accent }]}>
                          <Text
                            style={[
                              styles.dayText,
                              { color: selected ? "#fff" : disabled ? colors.border : colors.textPrimary },
                              selected && { fontWeight: "800" },
                            ]}
                          >
                            {d}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </View>
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
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginTop: 10 },
  sheetHead: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  sheetTitle: { flex: 1, fontSize: 18, fontWeight: "800", fontFamily: "Roboto" },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  monthLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  monthText: { fontSize: 15.5, fontWeight: "700", fontFamily: "Roboto" },
  weekRow: { flexDirection: "row" },
  weekday: { width: `${100 / 7}%`, textAlign: "center", fontSize: 12, fontWeight: "600", fontFamily: "Roboto", paddingVertical: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, height: 46, alignItems: "center", justifyContent: "center" },
  day: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  dayText: { fontSize: 15, fontFamily: "Roboto" },
  yearList: { height: YEAR_ROW * 6 },
  yearRow: { height: YEAR_ROW, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  yearText: { fontSize: 17, fontFamily: "Roboto" },
});

export default DateField;
