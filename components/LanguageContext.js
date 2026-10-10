import React, { createContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import en from "../constants/i18n/en";
import si from "../constants/i18n/si";
import es from "../constants/i18n/es";
import fr from "../constants/i18n/fr";
import de from "../constants/i18n/de";
import nl from "../constants/i18n/nl";
import pt from "../constants/i18n/pt";
import it from "../constants/i18n/it";
import ru from "../constants/i18n/ru";
import zh from "../constants/i18n/zh";
import ja from "../constants/i18n/ja";
import ko from "../constants/i18n/ko";
import hi from "../constants/i18n/hi";
import ta from "../constants/i18n/ta";
import { runWithSwitchLoader } from "./ui/switchLoader";

const LANGUAGE_STORAGE_KEY = "@app_language";
const DICTIONARIES = { en, si, es, fr, de, nl, pt, it, ru, zh, ja, ko, hi, ta };

// `name` is always shown in the language's own script so people can find
// theirs whatever the current UI language is; `english` is the helper label.
export const LANGUAGES = [
  { code: "en", name: "English", english: "English", locale: "en-US" },
  { code: "si", name: "සිංහල", english: "Sinhala", locale: "si-LK" },
  { code: "es", name: "Español", english: "Spanish", locale: "es-ES" },
  { code: "fr", name: "Français", english: "French", locale: "fr-FR" },
  { code: "de", name: "Deutsch", english: "German", locale: "de-DE" },
  { code: "nl", name: "Nederlands", english: "Dutch", locale: "nl-NL" },
  { code: "pt", name: "Português", english: "Portuguese", locale: "pt-BR" },
  { code: "it", name: "Italiano", english: "Italian", locale: "it-IT" },
  { code: "ru", name: "Русский", english: "Russian", locale: "ru-RU" },
  { code: "zh", name: "中文（简体）", english: "Chinese (Simplified)", locale: "zh-CN" },
  { code: "ja", name: "日本語", english: "Japanese", locale: "ja-JP" },
  { code: "ko", name: "한국어", english: "Korean", locale: "ko-KR" },
  { code: "hi", name: "हिन्दी", english: "Hindi", locale: "hi-IN" },
  { code: "ta", name: "தமிழ்", english: "Tamil", locale: "ta-IN" },
];

export const getLocale = (code) => LANGUAGES.find((l) => l.code === code)?.locale || "en-US";

export const LanguageContext = createContext();

const resolve = (dict, key) =>
  typeof key === "string"
    ? key.split(".").reduce((node, part) => (node && typeof node === "object" ? node[part] : undefined), dict)
    : undefined;

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState("en");
  const [ready, setReady] = useState(false);
  const [languageConfigured, setLanguageConfigured] = useState(false);
  const languageRef = useRef("en");
  languageRef.current = language;

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then((stored) => {
        if (stored && DICTIONARIES[stored]) {
          setLanguageState(stored);
          setLanguageConfigured(true);
        }
      })
      .finally(() => setReady(true));
  }, []);

  // `silent` skips the loading animation (used for background syncs).
  const setLanguage = useCallback((code, { silent = false } = {}) => {
    if (!DICTIONARIES[code]) return;
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code).catch(() => {});
    const apply = () => {
      setLanguageState(code);
      setLanguageConfigured(true);
    };
    if (silent || code === languageRef.current) apply();
    else runWithSwitchLoader("language", apply);
  }, []);

  // Server value wins the first time it's seen on this device (e.g. a fresh
  // install or a different device than where the preference was set) — but
  // never overrides a choice the user has already made locally, since that
  // local choice was just persisted above.
  const syncFromServer = useCallback(async (serverLanguage) => {
    if (!serverLanguage || !DICTIONARIES[serverLanguage]) return;
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (!stored) setLanguage(serverLanguage, { silent: true });
  }, [setLanguage]);

  // Second argument is either a plain-string fallback (existing calls) or a
  // vars object for {token} interpolation, e.g. t("x.y", { pct: 42 }).
  const t = useCallback(
    (key, fallbackOrVars) => {
      const value = resolve(DICTIONARIES[language], key) ?? resolve(en, key);
      if (value == null) {
        return typeof fallbackOrVars === "string" ? fallbackOrVars : key;
      }
      if (fallbackOrVars && typeof fallbackOrVars === "object") {
        return Object.keys(fallbackOrVars).reduce(
          (str, token) => str.replace(new RegExp(`\\{${token}\\}`, "g"), fallbackOrVars[token]),
          value,
        );
      }
      return value;
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, languageConfigured, syncFromServer, t, ready }),
    [language, setLanguage, languageConfigured, syncFromServer, t, ready],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
