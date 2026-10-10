import React, { useContext, useEffect, useRef, useState } from "react";
import LoaderModal from "./LoaderModal";
import { LanguageContext } from "../LanguageContext";
import { registerSwitchLoader } from "./switchLoader";

const APPLY_AFTER_MS = 350;
const HIDE_AFTER_MS = 1200;

// Shows the loading animation while the app language or theme is switched:
// the loader fades in, the change is applied underneath it, then it fades out
// on the finished result.
const SwitchLoaderHost = () => {
  const { t } = useContext(LanguageContext);
  const [kind, setKind] = useState(null);
  const busy = useRef(false);
  const timers = useRef([]);
  const pendingApply = useRef(null);

  useEffect(() => {
    const clear = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };

    const unregister = registerSwitchLoader((nextKind, apply) => {
      if (busy.current) {
        apply();
        return;
      }
      busy.current = true;
      pendingApply.current = apply;
      setKind(nextKind);
      timers.current.push(
        setTimeout(() => {
          const fn = pendingApply.current;
          pendingApply.current = null;
          if (fn) fn();
        }, APPLY_AFTER_MS),
        setTimeout(() => {
          busy.current = false;
          setKind(null);
        }, HIDE_AFTER_MS),
      );
    });

    return () => {
      unregister();
      clear();
      const fn = pendingApply.current;
      pendingApply.current = null;
      if (fn) fn();
    };
  }, []);

  if (!kind) return null;

  return (
    <LoaderModal
      visible
      title={t(kind === "theme" ? "ui.loader.themeTitle" : "ui.loader.languageTitle")}
      message={t(kind === "theme" ? "ui.loader.themeMessage" : "ui.loader.languageMessage")}
    />
  );
};

export default SwitchLoaderHost;
