import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { disablePush, enablePush, getPermissionState, isPushEnabled } from "../services/pushNotifications";

// State for the Notifications switch in Profile > Preferences.
export default function usePushSettings(username) {
  const [enabled, setEnabled] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [on, permission] = await Promise.all([isPushEnabled(username), getPermissionState()]);
      setEnabled(on);
      setBlocked(!permission.granted && !permission.canAskAgain);
    } catch {
      setEnabled(false);
    }
  }, [username]);

  useEffect(() => {
    refresh();
    // Coming back from the phone's system settings may have changed the permission.
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const toggle = useCallback(
    async (next) => {
      if (busy) return { ok: true };
      setBusy(true);
      try {
        if (next) {
          const result = await enablePush(username);
          await refresh();
          return result;
        }
        await disablePush(username);
        await refresh();
        return { ok: true };
      } finally {
        setBusy(false);
      }
    },
    [busy, username, refresh],
  );

  return { enabled, blocked, busy, toggle };
}
