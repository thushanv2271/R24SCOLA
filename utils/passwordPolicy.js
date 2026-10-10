export const MIN_PASSWORD_LENGTH = 8;

let LETTER = /[A-Za-z]/;
let DIGIT = /[0-9]/;
try {
  LETTER = new RegExp("\p{L}", "u");
  DIGIT = new RegExp("\p{Nd}", "u");
} catch (_) {}

// Mirrors the server rule (UsersController.ValidatePasswordStrength):
// returns "tooShort" | "weak" | null.
export const checkPasswordStrength = (password) => {
  const value = password || "";
  if (value.length < MIN_PASSWORD_LENGTH) return "tooShort";
  if (!LETTER.test(value) || !DIGIT.test(value)) return "weak";
  return null;
};
