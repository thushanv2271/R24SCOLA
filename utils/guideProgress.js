import { GUIDE_PHASES, useSetupGuide } from "./setupGuide";

// Which of the five setup tasks the user has finished. Shared by the owl's
// card, its badge and the chat's topic list so they always agree. (Language,
// light/dark, what you're looking for and notifications are chosen in the
// first-launch setup, so they are not tasks any more.)
export const useGuideProgress = () => {
  const guide = useSetupGuide();

  const isPhaseDone = (id) => guide.phaseDone.includes(id) || !!guide.external[id];

  const remaining = GUIDE_PHASES.filter((p) => !isPhaseDone(p.id)).length;
  return { isPhaseDone, remaining };
};
