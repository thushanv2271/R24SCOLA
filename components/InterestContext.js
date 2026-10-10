import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAllowedExploreTab } from "./exploreTabStore";

const INTEREST_STORAGE_KEY = "@app_interest";

export const INTERESTS = ["universities", "companies", "both"];

// Which side of Scola the user cares about: scholarships at universities,
// jobs at companies, or both. Chosen right after the language on first launch
// and changeable in Settings. "both" is the default so existing users see
// exactly what they saw before.
const toAllowedTab = (interest) =>
  interest === "universities" ? "scholarships" : interest === "companies" ? "jobs" : "both";

export const InterestContext = createContext({
  interest: "both",
  interestConfigured: false,
  interestReady: false,
  showUniversities: true,
  showCompanies: true,
  isBoth: true,
  setInterest: () => {},
});

export const InterestProvider = ({ children }) => {
  const [interest, setInterestState] = useState("both");
  const [interestConfigured, setInterestConfigured] = useState(false);
  const [interestReady, setInterestReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(INTEREST_STORAGE_KEY)
      .then((stored) => {
        if (INTERESTS.includes(stored)) {
          setInterestState(stored);
          setInterestConfigured(true);
          setAllowedExploreTab(toAllowedTab(stored));
        }
      })
      .catch(() => {})
      .finally(() => setInterestReady(true));
  }, []);

  const setInterest = useCallback((next) => {
    if (!INTERESTS.includes(next)) return;
    AsyncStorage.setItem(INTEREST_STORAGE_KEY, next).catch(() => {});
    setAllowedExploreTab(toAllowedTab(next));
    setInterestState(next);
    setInterestConfigured(true);
  }, []);

  const value = useMemo(
    () => ({
      interest,
      interestConfigured,
      interestReady,
      showUniversities: interest !== "companies",
      showCompanies: interest !== "universities",
      isBoth: interest === "both",
      setInterest,
    }),
    [interest, interestConfigured, interestReady, setInterest],
  );

  return <InterestContext.Provider value={value}>{children}</InterestContext.Provider>;
};

export const useInterest = () => useContext(InterestContext);
