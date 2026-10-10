import { Linking } from "react-native";

// Listing websites are user-supplied (creator listings), so only http(s)
// links are ever opened — never javascript:, intent:, file: or custom schemes.
export const toSafeWebUrl = (raw) => {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return /^https?:\/\/[^\s/$.?#][^\s]*$/i.test(withScheme) ? withScheme : null;
};

export const openExternalUrl = async (raw) => {
  const url = toSafeWebUrl(raw);
  if (!url) return false;
  try {
    await Linking.openURL(url);
    return true;
  } catch (error) {
    console.error("Could not open link:", error);
    return false;
  }
};

const EMAIL_PATTERN = /^[^\s@?&,;<>]+@[^\s@?&,;<>]+\.[^\s@?&,;<>]+$/;
export const toSafeMailto = (email, subject) => {
  const address = typeof email === "string" ? email.trim() : "";
  if (!EMAIL_PATTERN.test(address)) return null;
  return `mailto:${address}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
};
