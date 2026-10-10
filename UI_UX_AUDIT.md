# Scola App — UI/UX Audit

**Date:** 2026-09-30  **Scope:** `ScolaApp/` (Expo / React Native), all screens in `app/` and `components/`
**Standard used:** UI/UX Pro Max skill (priority rules §1–§9 + mobile pre-delivery checklist) and the Scola `ui-ux` project skill
**Method:** static code review (not a device test) — every finding cites file:line so it can be verified.

Severity: 🔴 Critical (money/data loss or broken flow) · 🟠 High (navigation, duplication, accessibility) · 🟡 Medium (consistency/polish) · ⚪ Low

---

## Summary

| Area | Verdict | Key numbers |
|---|---|---|
| Destructive / paid actions | 🔴 Fails | 3 one-tap actions spend coins or delete data with no confirmation |
| Navigation & duplication | 🟠 Fails | Drawer repeats 5 of 5 tab destinations; 3 screens registered twice; "Edit Mail" reachable from 5 places |
| Code-level duplication | 🟠 Fails | `Itjobs.jsx` is 91% identical to `Scholarships.jsx`; `favourites.jsx` ~50% identical to both |
| Dark mode / tokens | 🟠 Partial | 781 hardcoded hex colors; 22 screens/components never read the theme |
| Accessibility | 🟠 Partial | Header/card icon buttons 34–40 px (< 44/48); many icon-only buttons unlabeled |
| Localisation | 🟡 Partial | ~230 hardcoded English strings outside `en.js`/`si.js` |
| Loading/empty states | 🟡 Partial | Full-screen blocking loader on 19 screens; skeletons on only 2 |
| Forms (login/register) | ✅ Good | Labels above fields, inline errors, password toggle, `textContentType` |

---

## 1. 🔴 Critical — paid & destructive actions without confirmation

Rule: `confirmation-dialogs`, `destructive-emphasis`, `undo-support`, `primary-action`.

| # | Where | Problem | Fix |
|---|---|---|---|
| 1.1 | `app/(tabs)/Scholarships.jsx:129-155` (same in `Itjobs.jsx`) | Tapping the 36 px paper-plane icon **immediately charges 10 coins and emails a professor**. No confirm, no cost shown, icon has no visible text. | Replace with a labelled button "Request · 10 coins" and a confirm sheet showing cost + remaining balance. |
| 1.2 | `app/(tabs)/favourites.jsx:991-1040` | "Request all (50 coins)" in the ⋮ menu charges immediately. | Confirm sheet listing how many items will be sent and the total cost. |
| 1.3 | `app/(tabs)/favourites.jsx:1079-1100` | "Remove all" deletes every favourite on the server with **no confirm and no undo**; on failure it only `console.error`s (user sees nothing). | Confirm dialog (danger style) + "Undo" toast; show error toast on failure. |
| 1.4 | `app/Profile.jsx:193` and `components/ScolaMenu.jsx:88` | Logout fires instantly; in Profile it sits directly under "Delete account" in the same card. | Confirm logout; move Delete account to its own "Danger zone" section at the very bottom, separated from Logout. |

## 2. 🔴/🟠 Navigation bugs and duplicated navigation

Rules: `nav-hierarchy`, `avoid-mixed-patterns`, `back-stack-integrity`, `bottom-nav-top-level`.

**2.1 🔴 Drawer "Home" logs the user out visually.** `ScolaMenu.jsx:101` pushes `/` for Home. `/` is `app/index.jsx`, the *launch redirect*, which sends the user to `/login` or `/Instructions` (`app/index.jsx:21`). A logged-in user tapping Home in the menu lands on the login screen. → Navigate to `/(tabs)` instead.

**2.2 🟠 Two navigation systems for the same destinations.** The bottom tab bar (Home, Favourites, Explore, Inbox, Profile) and the hamburger drawer (`ScolaMenu.jsx:22-59`) both list Home, Profile, Scholarships, Jobs, Favourites and Messages. The drawer is opened from 12 screens. Users see two menus that do the same thing.
→ Keep tabs for top-level. Reduce the drawer to *secondary* items only (Wallet, Community, Check Eligibility, Edit Mail, Settings, Logout) — or remove it and put those in Profile/Home.

**2.3 🟠 Screens registered twice.** `Profile`, `Chats`, `Itjobs` exist as Stack routes (`app/_layout.jsx:34,36,50`) *and* as tab re-exports (`app/(tabs)/Profile.jsx`, `Chats.jsx`, `Jobs.jsx`). `/Profile` and `/Chats` resolve ambiguously; opening them from the drawer or `Community.jsx:243` can open the stack copy **without the tab bar** and with a different back behaviour. → Delete the Stack registrations and always navigate to the tab route.

**2.4 🟠 "Edit Mail" is reachable from 5 places**: Home quick-action card (`index.jsx:121`), drawer (`ScolaMenu.jsx:56`), Scholarship Calculator header icon (`ScholarshipCalculator.jsx:806`), Favourites floating button (`favourites.jsx:1545`), and instructions in `HowToApply.jsx`. → Keep it in one clear home (Profile › Settings or the Favourites "Request" flow where it's actually needed).

**2.5 🟡 Personal Details reachable 3× on nearby surfaces**: Home "Profile" ring, Profile "Complete your profile" button *and* the Personal Details row a few lines below (`Profile.jsx:352, 409`). → Keep the completion prompt only while the profile is incomplete; hide it at 100%.

**2.6 🟡 Coin balance shown 4× on Home**: wallet header icon, "Coins" activity ring, dismissible Coins card, and the drawer coins row. → One entry (the ring or the header chip), not four.

**2.7 🟡 Home quick actions duplicate tabs.** "Explore" (full-width card) and "Favourites" (`index.jsx:95-121`) are already bottom tabs. → Replace with actions that are *not* one tap away (e.g. Community, Check Eligibility, Wallet).

**2.8 🟡 Community header has a Messages button** (`Community.jsx:244`) duplicating the Inbox tab. → Remove.

**2.9 🟡 Every launch shows the login screen.** `login.jsx:59` reads `isLoggedIn` but never uses it; `app/index.jsx` always redirects to `/login`. Returning users must tap Login every time. → If a valid session exists, redirect straight to `/(tabs)`.

**2.10 🟡 No "Forgot password" path** on `login.jsx`. (`accessible-authentication`, `error-recovery`.)

## 3. 🟠 Unwanted / excess buttons

Rule: `primary-action` (one primary CTA per screen), `overflow-menu`, `touch-spacing`.

| Where | Issue | Recommendation |
|---|---|---|
| Scholarship / job card (`Scholarships.jsx:208-253`) | 3 floating icon buttons on the image (Report, Share to Community, Favourite) + the primary action is a tiny paper-plane icon. Report has the same visual weight as Favourite. | Keep Favourite on the image. Move Report + Share into a ⋮ overflow menu. Make Request the card's clear primary button with text. |
| Explore / Jobs headers (`Scholarships.jsx:1087`, `Itjobs.jsx:935`) | View-mode (list / grid / card — 3 layouts) + Filter + Menu. Three layouts triple the UI to maintain and test. | Keep one layout (card or list) + Filter. Drop the view-mode switch unless analytics show use. |
| Home header (`index.jsx:752`) | Wallet + Notifications + Menu. Wallet duplicates the Coins ring. | Notifications + (Menu if kept). |
| Scholarship Calculator header | "Edit Mail" (create) icon unrelated to the screen's task. | Remove. |
| CustomMail header (`CustomMail.jsx:318`) | School icon navigating to Scholarships — duplicate of the Explore tab. | Remove. |
| Scholarship card "View details" accordion | Detail expands inline *and* a quick-view sheet exists (`setQuickViewItem`). | Pick one (quick-view sheet). |

## 4. 🟠 Code-level duplication (causes UI drift)

| Files | Overlap | Effect |
|---|---|---|
| `app/(tabs)/Scholarships.jsx` (2 349 lines) ↔ `app/Itjobs.jsx` (2 033 lines) | **91%** of Itjobs lines are identical | Any UI fix must be made twice; they already diverge (e.g. Jobs header has NotificationModal, Scholarships doesn't). |
| `favourites.jsx` ↔ Scholarships / Itjobs | ~47–49% | Third copy of card, filter and request logic. |
| `MyCreatorListings.jsx` ↔ `AdminCreatorListings.jsx` | 76% | |
| `PrivacyPolicy.jsx` ↔ `HowToApply.jsx` | 55% | |
| `login.jsx` ↔ `RegisterForm.jsx` | ~50% | |

→ Extract `OpportunityCard`, `OpportunityList`, `FilterModal`, `useFavorites`, `useRequest` and a single `OpportunitiesScreen({ kind: "scholarship" | "job" })`. Target: Scholarships + Jobs + Favourites share one card/list implementation.

## 5. 🟠 Dark mode and design tokens

Rules: `color-semantic`, `dark-mode-pairing`, `Token-driven theming`.

- **781 hardcoded hex colors** in `app/` + `components/` — top offenders: `Scholarships.jsx` (113), `Itjobs.jsx` (103), `favourites.jsx` (56), `Community.jsx` (43), `ScholarshipCalculator.jsx` (36), `CommunityPostDetail.jsx` (33). `#004aad` alone is hardcoded 130×; `#111827` 57×.
- **Screens that never call `useTheme()` (will render light in dark mode):** `CommunityPostDetail`, `PersonalDetails`, `HowToApply`, `PrivacyPolicy`, `Instructions`, plus components `ScolaMenu`, `BottomModal`, `ToastNotification`, `TreasureChestModal`, `CustomizeEmailMessageModal`, `DeleteAccountModal`, `AvatarPickerModal`, `LanguagePickerModal`, `InsufficientCoinsModal`, `InfoCard`, `StatCard`, `Button`, `Badge`.
- `constants/colors.js` sets `PRIMARY_BLUE` = `#004aad`, but `COLOR_STANDARDIZATION.md` says `#007bff` → docs are stale. `Colors.ts` still has the template indigo `tint: #6366f1`.
- Home hero uses ad-hoc ring colors (`#34d399`, `#c084fc`, `#60a5fa`, `#fbbf24`) and status-dot colors not in the palette.
- Home "Free member" badge uses the **error (red)** tone (`index.jsx:455`) — reads as a problem, not a plan. Use neutral/info tone.

## 6. 🟠 Accessibility & touch

Rules: `touch-target-size` (44 pt iOS / 48 dp Android), `aria-labels`, `icon-context`, `dynamic-type`.

- `ScreenHeader` icon buttons are **40×40** (`ScreenHeader.jsx` `iconBackground`) — used on nearly every screen. → 44×44 min, or add `hitSlop`.
- Card overlay buttons (report / share / favourite) are ~34 px (18 px icon + 8 px padding); request button 36 px.
- Tab bar labels are **10.5 px** (`AppTabBar.tsx` `tabLabel`); ~55 other text styles use 9–11 px. Minimum 12 px, body ≥ 14 px.
- Unlabeled icon-only buttons: card **Report** flag (`Scholarships.jsx:208`), header **Notifications** (`index.jsx:761`, `Profile.jsx:302`), Calculator/CustomMail header icons, drawer **Close** (`ScolaMenu.jsx:141`), view-details toggle. `Profile.jsx` has 12 touchables and 0 `accessibilityLabel`s.
- Hardcoded English labels for screen readers ("Go back", "Open menu", "Explore", "Toggle search") — not translated for Sinhala users.
- `ScreenHeader` title is `flex:1, textAlign:center` with a back button on the left only → title is visibly off-centre.
- Favourite via double-tap on image has a visible button alternative ✅.

## 7. 🟡 Loading, empty and error states

Rules: `progressive-loading`, `loading-states`, `empty-states`, `error-recovery`.

- `LoaderModal` (full-screen modal) is used on **19 screens**. Its default copy says *"Hang tight… You'll be redirected shortly!"* even when nothing redirects. → Use `SkeletonCard` in lists (only used in 2 files today) and inline spinners elsewhere; fix the copy.
- Only 12 `ListEmptyComponent`s across the app; 29 `ScrollView`s and 62 `.map(` renders — check long lists (community feed, chats, admin lists) use `FlatList` with empty states.
- Many errors surface as a generic "Error" title (`Scholarships.jsx:147,160`, `CustomMail.jsx:113,158,177`, `CommunityPostDetail.jsx:95,110`) — state the cause + a retry action.

## 8. 🟡 Localisation

~230 hardcoded English strings bypass `t()`. Largest: `ScholarshipCalculator.jsx` (62), `Scholarships.jsx` (26), `HowToApply.jsx` (19), `Itjobs.jsx` (13), `index.jsx` (13: "Active", "Offline", "Discover", tagline, ring labels "Progress/Score/Profile/Coins", banner texts), `PrivacyPolicy.jsx` (12), `NotificationModal.jsx`, `InsufficientCoinsModal.jsx`, `LoaderModal.jsx`, tab titles in `(tabs)/_layout.jsx`, card labels ("Posted", "University:", "Website:", "Department Head:").

## 9. ⚪ Style consistency

- Emoji used as UI content: greeting "🌞 Good Morning" (`index.jsx:334`), calculator result headings "🎯 / ✅" (`ScholarshipCalculator.jsx:594+`), "You're lucky! 🎉" (`TreasureChestModal.jsx:216`), "☰" in HowToApply text. Replace with Ionicons for consistency (rule `no-emoji-icons`).
- Mixed icon families on one card: `FontAwesome` heart + `Ionicons` everything else.
- Tab-bar bounce animation on every tab press + center FAB bounce + coin burst + heart burst — consider `reduced-motion` (`AccessibilityInfo.isReduceMotionEnabled`).
- Drawer and tab bar use fixed pixel paddings instead of `useSafeAreaInsets()` (`AppTabBar.tsx` `paddingBottom: 22/14`, `ScolaMenu.jsx` `paddingTop: StatusBar.currentHeight || 50`).

## What's already good ✅

- Login / Register: visible labels, inline Formik errors, password show/hide with label, `textContentType`, disabled + spinner on submit.
- Tab bar: icon + label, active state, badges, `accessibilityRole="tab"` + `selected` state.
- A real token layer (`components/tokens`, `Colors.ts` light/dark) and shared `ScreenHeader` exist — the foundation is right; adoption is the gap.
- Theme picker (system/light/dark) and English/Sinhala switch.

---

## Recommended fix order

1. **This week (critical):** confirmations for Request / Request all / Remove all / Logout (1.1–1.4); fix drawer Home → `/(tabs)` (2.1); skip login when session exists (2.9).
2. **Navigation cleanup:** remove duplicate Stack routes (2.3); cut the drawer to secondary items (2.2); remove duplicate header buttons and entry points (§3, 2.4–2.8).
3. **Refactor:** merge Scholarships/Jobs/Favourites into shared components (§4) — makes every later UI fix 1× instead of 3×.
4. **Theme + a11y pass:** convert the 22 non-themed files; 44 px targets in `ScreenHeader` and cards; labels on icon buttons; min font 12 px.
5. **Polish:** skeleton loading, empty/error states, move hardcoded strings to `en.js`/`si.js`, remove emoji.

*Limitations: static review only — not run on a device. Contrast ratios, real safe-area behaviour and Sinhala text overflow should be verified on a small Android phone in both themes.*

---

## Fix status

Fixed (static verification only: parse check, undefined-identifier scan, en/si key parity 502/502; not run on a device):
- Duplicate navigation removed (Home tiles vs tab bar/drawer, wallet icon vs Coins ring, duplicate header icons, Itjobs route folded into the Jobs tab).
- Confirmations added for request, request-all, remove-all and logout; error alerts instead of silent failures; Danger zone in Profile.
- Dark-mode theming, i18n (en/si) and accessibility roles/labels/touch targets (44-48px) extended to most screens and shared components; emoji removed from UI; text below 12px raised.
- Brand blue unified to #004aad.

Deferred:
- Full merge of Scholarships / Jobs / Favourites into one shared list component.
- Removing the view-mode toggle (product decision).
- Forgot-password (no backend endpoint; `ui.auth.forgotPassword*` keys unused).
- ScholarshipCalculator hardcoded strings (~62); PrivacyPolicy / HowToApply legal text is themed but not localised (Privacy point 5 still says to contact us to delete an account, although in-app delete exists).
- Unused legacy styles in Scholarships/Jobs cards and PrivacyPolicy/HowToApply headers.
- Skeleton/inline loaders instead of the full-screen LoaderModal.
