import { parseDate } from "../components/ui/DateField";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s\-()]+$/;
const LETTER_RE = /\p{L}/gu;

// Returns a translation key describing the problem, or null when valid.
export const validateField = (key, rawValue) => {
  const value = (rawValue || "").trim();
  if (!value) return "personalDetails.errRequired";
  switch (key) {
    case "fullName":
      return (value.match(LETTER_RE) || []).length >= 2 ? null : "personalDetails.errName";
    case "email":
      return EMAIL_RE.test(value) ? null : "personalDetails.errEmail";
    case "phoneNumber": {
      const digits = value.replace(/\D/g, "").length;
      return PHONE_RE.test(value) && digits >= 7 && digits <= 15 ? null : "personalDetails.errPhone";
    }
    case "dateOfBirth": {
      const parsed = parseDate(value);
      if (!parsed) return "personalDetails.errDob";
      const now = new Date();
      let age = now.getFullYear() - parsed.y;
      if (now.getMonth() < parsed.m || (now.getMonth() === parsed.m && now.getDate() < parsed.d)) age -= 1;
      return age >= 10 && age <= 100 ? null : "personalDetails.errDob";
    }
    case "fieldOfStudy":
      return value.length >= 2 ? null : "personalDetails.errField";
    default:
      return null;
  }
};
