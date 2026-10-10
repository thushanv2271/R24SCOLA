// Shared between RegisterForm.jsx (sets the flag right after signup) and the
// Home screen (reads it once, on the first post-signup visit, to play the
// treasure-chest welcome animation) — a single source of truth for the key
// avoids the two ever drifting out of sync.
export const PENDING_WELCOME_BONUS_KEY = "scola_pending_welcome_bonus";
