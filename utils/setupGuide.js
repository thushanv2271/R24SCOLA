import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// State for Hoot, the owl guide that walks users through setting Scola up on
// the real screens. `screen` is the screen key the step belongs to; `route` is
// where to go to reach it; `target` is the element to point at; `watch` names
// a setting whose change means the user did the step; `advanceOnScreen` moves
// on as soon as the user lands on that screen (e.g. after tapping a row).

// Language, light/dark, what you're looking for and notifications are chosen
// in the first-launch setup, so they are no longer part of the owl's tasks.
// The five things left to do, shown as the task progress strip.
export const GUIDE_PHASES = [
  { id: "profile", start: "details", icon: "person", titleKey: "home.stepProfile" },
  { id: "mail", start: "mail", icon: "mail", titleKey: "home.stepMail" },
  { id: "eligibility", start: "eligibility", icon: "checkmark-circle", titleKey: "home.stepEligibility" },
  { id: "save", start: "save", icon: "heart", titleKey: "home.stepSave" },
  { id: "request", start: "request", icon: "paper-plane", titleKey: "home.stepRequest" },
];

// The quick feature tour: five stops, nothing to do, skippable at any time.
// Each stop takes you to the screen and points the owl at its tab button
// (`fixed`: the target lives in the always-visible tab bar, so the owl never
// asks you to scroll to it).
export const TOUR_PHASES = [
  { id: "t_home", icon: "home", titleKey: "tabs.home" },
  { id: "t_explore", icon: "compass", titleKey: "tabs.explore" },
  { id: "t_favourites", icon: "heart", titleKey: "tabs.favourites" },
  { id: "t_inbox", icon: "chatbubbles", titleKey: "tabs.inbox" },
  { id: "t_profile", icon: "person", titleKey: "tabs.profile" },
];

// group "tour": the quick tour. "help": one-off how-tos Hoot's chat can start
// (they end after one step, `solo`). "task": the guided to-dos behind Home's
// checklist, which run in order.
export const GUIDE_STEPS = [
  { id: "welcome", group: "tour", textKey: "onboardingFlow.tourWelcome", screen: "(tabs)/index", route: "/(tabs)", kind: "intro" },
  { id: "tourHome", group: "tour", phase: "t_home", textKey: "onboardingFlow.tourHome", screen: "(tabs)/index", route: "/(tabs)", target: "tab.index", fixed: true },
  { id: "tourExplore", group: "tour", phase: "t_explore", textKey: "onboardingFlow.tourExplore", screen: "(tabs)/Scholarships", route: "/(tabs)/Scholarships", target: "tab.Scholarships", fixed: true },
  { id: "tourFavourites", group: "tour", phase: "t_favourites", textKey: "onboardingFlow.tourFavourites", screen: "(tabs)/favourites", route: "/(tabs)/favourites", target: "tab.favourites", fixed: true },
  { id: "tourInbox", group: "tour", phase: "t_inbox", textKey: "onboardingFlow.tourMessages", screen: "(tabs)/Chats", route: "/(tabs)/Chats", target: "tab.Chats", fixed: true },
  { id: "tourProfile", group: "tour", phase: "t_profile", textKey: "onboardingFlow.tourProfile", screen: "(tabs)/Profile", route: "/(tabs)/Profile", target: "tab.Profile", fixed: true },
  { id: "tourDone", group: "tour", textKey: "onboardingFlow.tourDone", screen: "(tabs)/index", route: "/(tabs)", kind: "outro" },
  { id: "language", group: "help", solo: true, screen: "(tabs)/Profile", route: "/(tabs)/Profile", target: "profile.language", watch: "language" },
  { id: "theme", group: "help", solo: true, screen: "(tabs)/Profile", route: "/(tabs)/Profile", target: "profile.theme", watch: "theme" },
  { id: "notifications", group: "help", solo: true, screen: "(tabs)/Profile", route: "/(tabs)/Profile", target: "profile.notifications" },
  { id: "feedback", group: "help", solo: true, screen: "(tabs)/Profile", route: "/(tabs)/Profile", target: "profile.feedback", watch: "feedback" },
  { id: "details", group: "task", phase: "profile", screen: "(tabs)/Profile", route: "/(tabs)/Profile", target: "profile.details", advanceOnScreen: "PersonalDetails" },
  { id: "detailsForm", group: "task", phase: "profile", screen: "PersonalDetails", route: "/PersonalDetails", leaveAdvances: true },
  { id: "mail", group: "task", phase: "mail", screen: "(tabs)/Profile", route: "/(tabs)/Profile", target: "profile.mail", advanceOnScreen: "CustomMail" },
  { id: "mailEditor", group: "task", phase: "mail", screen: "CustomMail", route: "/CustomMail", leaveAdvances: true },
  { id: "eligibility", group: "task", phase: "eligibility", screen: "ScholarshipCalculator", route: "/ScholarshipCalculator" },
  { id: "save", group: "task", phase: "save", screen: "(tabs)/Scholarships", route: "/(tabs)/Scholarships" },
  { id: "request", group: "task", phase: "request", screen: "(tabs)/favourites", route: "/(tabs)/favourites" },
  { id: "done", group: "task", screen: "(tabs)/index", route: "/(tabs)", kind: "outro" },
];

const SEEN_KEY = "@scola_guide_seen";
const PET_KEY = "@scola_pet_hidden";

// phaseDone / stepDone: finished during this session (e.g. a form was saved).
// external: completion flags Home works out from the account's data.
let state = { active: false, index: 0, minimized: false, seen: [], petHidden: false, phaseDone: [], stepDone: [], external: {} };
const listeners = new Set();
const set = (next) => {
  state = next;
  listeners.forEach((fn) => fn());
};

AsyncStorage.getItem(SEEN_KEY)
  .then((raw) => {
    if (raw) set({ ...state, seen: JSON.parse(raw) });
  })
  .catch(() => {});

AsyncStorage.getItem(PET_KEY)
  .then((raw) => {
    if (raw === "1") set({ ...state, petHidden: true });
  })
  .catch(() => {});

export const setPetHidden = (hidden) => {
  AsyncStorage.setItem(PET_KEY, hidden ? "1" : "0").catch(() => {});
  set({ ...state, petHidden: hidden });
};

export const markGuideStepDone = (stepId, phaseId) => {
  const stepDone = state.stepDone.includes(stepId) ? state.stepDone : [...state.stepDone, stepId];
  const phaseDone = !phaseId || state.phaseDone.includes(phaseId) ? state.phaseDone : [...state.phaseDone, phaseId];
  if (stepDone !== state.stepDone || phaseDone !== state.phaseDone) set({ ...state, stepDone, phaseDone });
};

export const setGuideExternalDone = (external) => {
  const same = Object.keys(external).every((k) => state.external[k] === external[k]);
  if (!same) set({ ...state, external: { ...state.external, ...external } });
};

const markSeen = (id) => {
  if (state.seen.includes(id)) return state.seen;
  const seen = [...state.seen, id];
  AsyncStorage.setItem(SEEN_KEY, JSON.stringify(seen)).catch(() => {});
  return seen;
};

export const markGuideSeen = (id) => {
  const seen = markSeen(id);
  if (seen !== state.seen) set({ ...state, seen });
};

export const startSetupGuide = (stepId = "welcome") => {
  const index = Math.max(0, GUIDE_STEPS.findIndex((s) => s.id === stepId));
  set({ ...state, active: true, index, minimized: false });
};

export const nextGuideStep = () => {
  if (!state.active) return;
  const current = GUIDE_STEPS[state.index];
  const seen = markSeen(current.id);
  const upcoming = GUIDE_STEPS[state.index + 1];
  // A one-off help step, the end of the tour, or the end of the list: finish.
  if (current.solo || !upcoming || upcoming.group !== current.group) {
    return set({ ...state, active: false, index: 0, minimized: false, seen });
  }
  set({ ...state, index: state.index + 1, minimized: false, seen });
};

// Back only moves within the same walkthrough (never from a task into the tour).
export const canGuideGoBack = (index) => {
  const current = GUIDE_STEPS[index];
  const previous = GUIDE_STEPS[index - 1];
  return !!current && !!previous && previous.group === current.group && current.kind !== "intro" && !current.solo;
};

export const prevGuideStep = () => {
  if (state.active && canGuideGoBack(state.index)) set({ ...state, index: state.index - 1, minimized: false });
};

export const endSetupGuide = () => {
  if (state.active) set({ ...state, active: false, index: 0, minimized: false });
};

export const setGuideMinimized = (minimized) => {
  if (state.active) set({ ...state, minimized });
};

export const getSetupGuide = () => state;

export const useSetupGuide = () =>
  useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => state,
  );
