/**
 * Centralized API Service
 * Handles all backend API calls with environment-based configuration
 */

import { secureGetItem } from "./secureStorage";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Without a timeout a stalled connection leaves screens on a spinner forever.
const REQUEST_TIMEOUT_MS = 20000;

// In-memory cache of the auth token so we don't hit secure storage on every
// request. Kept in sync by AuthContext via setAuthToken() on login/logout.
let cachedToken = null;
// Public URL of a user's gallery avatar. The version (from the server) is part
// of the URL so a changed photo is fetched fresh and an unchanged one is cached.
export const avatarPhotoUrl = (username, version) =>
  username && version
    ? `${API_BASE_URL}/Users/${encodeURIComponent(username)}/avatar-photo?v=${version}`
    : null;

export const setAuthToken = (token) => {
  cachedToken = token || null;
};

// Fired whenever an authenticated request comes back 401, so the app can
// clear the stale session and send the user back to login instead of
// silently failing every subsequent call. Wired up by AuthContext.
let unauthorizedHandler = null;
export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

/**
 * Generic fetch wrapper with error handling
 */
const apiCall = async (endpoint, options = {}, config = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const shouldUseAuth = config.requiresAuth !== false;
    let token = null;
    if (shouldUseAuth) {
      token = cachedToken;
      if (!token) {
        token = await secureGetItem("userToken");
        if (token) cachedToken = token;
      }
    }

    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    const { headers: extraHeaders, ...fetchOptions } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        ...fetchOptions,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...authHeader,
          ...extraHeaders,
        },
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      let parsedBody = null;
      try {
        const errorData = await response.text();
        // Handle empty responses (like Forbid())
        if (!errorData || errorData.trim() === "") {
          if (response.status === 403) {
            errorMessage = "Access forbidden";
          } else if (response.status === 401) {
            errorMessage = "Unauthorized - please login";
          }
        } else {
          // Try to parse as JSON
          try {
            const parsed = JSON.parse(errorData);
            parsedBody = parsed;
            if (parsed?.errors && typeof parsed.errors === "object") {
              const firstKey = Object.keys(parsed.errors)[0];
              const firstError = parsed.errors[firstKey]?.[0];
              errorMessage =
                firstError || parsed.title || parsed.message || errorMessage;
            } else {
              errorMessage = parsed.message || parsed.title || errorMessage;
            }
          } catch (e) {
            // If not JSON, use the text directly (remove quotes if present)
            errorMessage = errorData.replace(/^"+|"+$/g, "") || errorMessage;
          }
        }
      } catch (e) {
        // If reading response fails, use status code
      }
      if (response.status === 401 && shouldUseAuth) {
        unauthorizedHandler?.();
      }

      const httpError = new Error(errorMessage);
      httpError.status = response.status;
      httpError.endpoint = endpoint;
      // Structured error bodies (e.g. WalletController's { code, coins,
      // required, shortfall }) ride along here so callers can branch on
      // error.data.code instead of parsing the message string.
      httpError.data = parsedBody;
      throw httpError;
    }

    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    if (!text || text.trim() === "") return null;
    return JSON.parse(text);
  } catch (error) {
    const status = error?.status;
    // An error with no `.status` never made it to a real HTTP response —
    // it failed in fetch() itself (no connectivity, DNS failure, timeout,
    // TLS failure) or while reading/parsing an otherwise-successful
    // response. Either way, the raw error (e.g. "Network request failed",
    // "TypeError: Failed to fetch") is meaningless to a user and, from a
    // security standpoint, isn't something worth surfacing verbatim either
    // — so every caller gets one consistent, actionable message instead of
    // silently failing or showing a confusing technical string.
    if (!status) {
      error.isNetworkError = true;
      error.message =
        "No internet connection. Please check your connection and try again.";
    }
    if (!status || status >= 500) {
      console.error(`API Error at ${endpoint}:`, error);
    }
    throw error;
  }
};

/**
 * Authentication APIs
 */
export const authAPI = {
  checkUserExists: (username) =>
    apiCall(
      `/Users/${encodeURIComponent(username)}`,
      { method: "GET" },
      { requiresAuth: false },
    ),

  login: (credentials) =>
    apiCall(
      "/Users/login",
      {
        method: "POST",
        body: JSON.stringify(credentials),
      },
      { requiresAuth: false },
    ),

  register: (userData) =>
    apiCall(
      "/Users/register",
      {
        method: "POST",
        body: JSON.stringify(userData),
      },
      { requiresAuth: false },
    ),

  forgotPassword: (username) =>
    apiCall(
      "/Users/forgot-password",
      { method: "POST", body: JSON.stringify({ username }) },
      { requiresAuth: false },
    ),

  resetPassword: (username, code, newPassword) =>
    apiCall(
      "/Users/reset-password",
      { method: "POST", body: JSON.stringify({ username, code, newPassword }) },
      { requiresAuth: false },
    ),

  getUserByUsername: (username) =>
    apiCall(`/Users/${encodeURIComponent(username)}`, { method: "GET" }),

  getAdminAnalytics: () =>
    apiCall("/Users/analytics/all", { method: "GET" }),

  getAdminUsers: (page = 1, pageSize = 10, search = "") => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search.trim()) params.set("search", search.trim());
    return apiCall(`/Users/analytics/paged?${params.toString()}`, { method: "GET" }).catch(async (error) => {
      if (error?.status !== 404) throw error;
      const allUsers = await apiCall("/Users/analytics/all", { method: "GET" });
      const users = Array.isArray(allUsers) ? allUsers : [];
      const query = search.trim().toLowerCase();
      const matchedUsers = query
        ? users.filter((adminUser) => [adminUser.username, adminUser.fullName, adminUser.email, adminUser.country, adminUser.fieldOfStudy]
          .some((value) => value?.toLowerCase?.().includes(query)))
        : users;
      const start = (page - 1) * pageSize;
      return {
        users: matchedUsers.slice(start, start + pageSize),
        totalCount: matchedUsers.length,
        page,
        pageSize,
        pageCount: Math.ceil(matchedUsers.length / pageSize),
      };
    });
  },

  // Admin-only, whitelisted partial edit (see AdminUserUpdate on the
  // backend) — never a full-document replace. Any subset of these fields
  // may be omitted.
  updateUserAdmin: (userId, fields) =>
    apiCall(`/Users/admin-user/${userId}`, {
      method: "PUT",
      body: JSON.stringify(fields),
    }),

  deleteUserAdmin: (userId, note = "") =>
    apiCall(`/Users/admin-user/${userId}`, {
      method: "DELETE",
      body: JSON.stringify({ note }),
    }),

  // Favorite Management
  getFavorites: (username) =>
    apiCall(`/Users/${encodeURIComponent(username)}/favorites`, {
      method: "GET",
    }),

  addFavorite: (username, scholarshipId) =>
    apiCall(`/Users/${encodeURIComponent(username)}/favorites/by-username`, {
      method: "POST",
      body: JSON.stringify(scholarshipId),
    }),

  removeFavorite: (username, scholarshipId) =>
    apiCall(
      `/Users/${encodeURIComponent(username)}/favorites/by-username/${scholarshipId}`,
      {
        method: "DELETE",
      },
    ),

  // Job Favorite Management
  getJobFavorites: (username) =>
    apiCall(`/Users/${encodeURIComponent(username)}/job-favorites`, {
      method: "GET",
    }),

  addJobFavorite: (username, jobId) =>
    apiCall(
      `/Users/${encodeURIComponent(username)}/job-favorites/by-username`,
      {
        method: "POST",
        body: JSON.stringify(jobId),
      },
    ),

  removeJobFavorite: (username, jobId) =>
    apiCall(
      `/Users/${encodeURIComponent(username)}/job-favorites/by-username/${jobId}`,
      {
        method: "DELETE",
      },
    ),

  // Email Management
  getEmailMessage: (username) =>
    apiCall(`/Users/${encodeURIComponent(username)}/email-message`, {
      method: "GET",
    }),

  updateEmailMessage: (username, message) =>
    apiCall(`/Users/${encodeURIComponent(username)}/email-message`, {
      method: "PUT",
      body: JSON.stringify({ scholarshipEmailMessage: message }),
    }),

  // Job Email Management
  getJobEmailMessage: (username) =>
    apiCall(`/Users/${encodeURIComponent(username)}/job-email-message`, {
      method: "GET",
    }),

  updateJobEmailMessage: (username, message) =>
    apiCall(`/Users/${encodeURIComponent(username)}/job-email-message`, {
      method: "PUT",
      body: JSON.stringify({ jobEmailMessage: message }),
    }),

  // Sends the user's saved message as a real HTML email via the backend
  // (SMTP), so rich-text formatting actually reaches the recipient's inbox.
  sendScholarshipEmail: (username, recipientEmail, recipientName, scholarshipTitle) =>
    apiCall(`/Users/${encodeURIComponent(username)}/send-scholarship-email`, {
      method: "POST",
      body: JSON.stringify({
        recipientEmail,
        recipientName,
        scholarshipTitle,
      }),
    }),

  sendJobEmail: (username, recipientEmail, recipientName, jobTitle) =>
    apiCall(`/Users/${encodeURIComponent(username)}/send-job-email`, {
      method: "POST",
      body: JSON.stringify({ recipientEmail, recipientName, jobTitle }),
    }),

  // Personal details, language, account deletion
  updatePersonalDetails: (username, details) =>
    apiCall(`/Users/${encodeURIComponent(username)}/personal-details`, {
      method: "PUT",
      body: JSON.stringify(details),
    }),

  updateLanguage: (username, language) =>
    apiCall(`/Users/${encodeURIComponent(username)}/language`, {
      method: "PUT",
      body: JSON.stringify({ language }),
    }),

  registerPushToken: (username, token) =>
    apiCall(`/Users/${encodeURIComponent(username)}/push-token`, {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  unregisterPushToken: (username, token) =>
    apiCall(`/Users/${encodeURIComponent(username)}/push-token/remove`, {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  sendAppUpdateNotice: () =>
    apiCall("/Users/admin/app-update-notice", { method: "POST", body: JSON.stringify({}) }),

  changePassword: (username, currentPassword, newPassword) =>
    apiCall(`/Users/${encodeURIComponent(username)}/password`, {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  updateCreatorMode: (username, creatorModeEnabled, creatorRole) =>
    apiCall(`/Users/${encodeURIComponent(username)}/creator-mode`, {
      method: "PUT",
      body: JSON.stringify({ creatorModeEnabled, creatorRole }),
    }),

  // Syncs the preset avatar icon+color server-side (icon/color null clears
  // it) so other users — e.g. the other side of a chat — can see it too.
  updateAvatar: (username, icon, color) =>
    apiCall(`/Users/${encodeURIComponent(username)}/avatar`, {
      method: "PUT",
      body: JSON.stringify({ icon, color }),
    }),

  updateAvatarPhoto: (username, imageBase64) =>
    apiCall(`/Users/${encodeURIComponent(username)}/avatar-photo`, {
      method: "PUT",
      body: JSON.stringify({ imageBase64 }),
    }),

  removeAvatarPhoto: (username) =>
    apiCall(`/Users/${encodeURIComponent(username)}/avatar-photo`, {
      method: "DELETE",
    }),

  deleteAccount: (username, reason, note) =>
    apiCall(`/Users/${encodeURIComponent(username)}`, {
      method: "DELETE",
      body: JSON.stringify({ reason, note }),
    }),

};

/**
 * Scola Coin wallet APIs — balance, spend history, and the only path that's
 * allowed to charge coins. The server is authoritative on cost: the client
 * only ever names *what* it's paying for (requestType + itemId/itemIds),
 * never an amount.
 */
export const walletAPI = {
  getWallet: (username) =>
    apiCall(`/Wallet/${encodeURIComponent(username)}`, { method: "GET" }),

  getTransactions: (username, limit = 50) =>
    apiCall(
      `/Wallet/${encodeURIComponent(username)}/transactions?limit=${limit}`,
      { method: "GET" },
    ),

  // Charges for one scholarship/job request and marks it requested.
  // Rejects with error.status 402 (error.data.code === "INSUFFICIENT_COINS")
  // if the balance is too low, or 409 (error.data.code === "ALREADY_REQUESTED")
  // if this exact item was already paid for.
  chargeRequest: (username, requestType, itemId, itemTitle) =>
    apiCall(`/Wallet/${encodeURIComponent(username)}/request`, {
      method: "POST",
      body: JSON.stringify({ requestType, itemId, itemTitle }),
    }),

  // Charges one flat bulk fee covering every id in itemIds that hasn't
  // already been requested (already-requested ids are skipped for free).
  chargeBulkRequest: (username, requestType, itemIds) =>
    apiCall(`/Wallet/${encodeURIComponent(username)}/request-bulk`, {
      method: "POST",
      body: JSON.stringify({ requestType, itemIds }),
    }),
};

/**
 * Community APIs — posts (universities/jobs), ratings, comments.
 */
export const communityAPI = {
  getAdminPostViews: (page = 1, pageSize = 20, sortBy = "date") => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (sortBy) params.set("sortBy", sortBy);
    return apiCall(`/Community/admin/posts?${params.toString()}`, { method: "GET" });
  },

  getPosts: (type, { category, page = 0, pageSize = 20 } = {}) => {
    const params = new URLSearchParams({ type, page: String(page), pageSize: String(pageSize) });
    if (category) params.set("category", category);
    return apiCall(`/Community/posts?${params.toString()}`, { method: "GET" });
  },

  getPost: (id) => apiCall(`/Community/posts/${encodeURIComponent(id)}`, { method: "GET" }),

  recordPostView: (id) =>
    apiCall(`/Community/posts/${encodeURIComponent(id)}/view`, { method: "POST" }),

  createPost: (post) =>
    apiCall("/Community/posts", { method: "POST", body: JSON.stringify(post) }),

  updatePost: (id, post) =>
    apiCall(`/Community/posts/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(post),
    }),

  deletePost: (id) =>
    apiCall(`/Community/posts/${encodeURIComponent(id)}`, { method: "DELETE" }),

  ratePost: (id, value) =>
    apiCall(`/Community/posts/${encodeURIComponent(id)}/rate`, {
      method: "POST",
      body: JSON.stringify({ value }),
    }),

  getComments: (id) =>
    apiCall(`/Community/posts/${encodeURIComponent(id)}/comments`, { method: "GET" }),

  addComment: (id, text) =>
    apiCall(`/Community/posts/${encodeURIComponent(id)}/comments`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
};

export const creatorListingsAPI = {
  getByType: (type) =>
    apiCall(`/CreatorListings?type=${encodeURIComponent(type)}`, { method: "GET" }),

  create: (listing) =>
    apiCall("/CreatorListings", {
      method: "POST",
      body: JSON.stringify(listing),
    }),

  recordView: (id) =>
    apiCall(`/CreatorListings/${encodeURIComponent(id)}/view`, { method: "POST" }),

  recordRequest: (id) =>
    apiCall(`/CreatorListings/${encodeURIComponent(id)}/request`, { method: "POST" }),

  getMine: () => apiCall("/CreatorListings/mine", { method: "GET" }),

  getAllForAdmin: (page = 1, pageSize = 20, { status, type, sortBy } = {}) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    if (sortBy) params.set("sortBy", sortBy);
    return apiCall(`/CreatorListings/admin?${params.toString()}`, { method: "GET" });
  },

  review: (id, status) =>
    apiCall(`/CreatorListings/${encodeURIComponent(id)}/review`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  update: (id, listing) =>
    apiCall(`/CreatorListings/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(listing),
    }),

  remove: (id) =>
    apiCall(`/CreatorListings/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

/**
 * Chat APIs — 1:1 direct messages. Polling-based: call getMessages with
 * `since` on an interval to pick up new messages rather than a live socket.
 */
export const chatAPI = {
  getConversations: () => apiCall("/Chat/conversations", { method: "GET" }),

  startConversation: (username) =>
    apiCall("/Chat/conversations", {
      method: "POST",
      body: JSON.stringify({ username }),
    }),

  getMessages: (conversationId, since) => {
    const params = since ? `?since=${encodeURIComponent(since)}` : "";
    return apiCall(`/Chat/conversations/${encodeURIComponent(conversationId)}/messages${params}`, {
      method: "GET",
    });
  },

  sendMessage: (conversationId, text) =>
    apiCall(`/Chat/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  markRead: (conversationId) =>
    apiCall(`/Chat/conversations/${encodeURIComponent(conversationId)}/read`, {
      method: "POST",
    }),

  editMessage: (conversationId, messageId, text) =>
    apiCall(
      `/Chat/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`,
      { method: "PUT", body: JSON.stringify({ text }) },
    ),

  deleteMessage: (conversationId, messageId) =>
    apiCall(
      `/Chat/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`,
      { method: "DELETE" },
    ),
};

/**
 * Calculator Result APIs
 */
export const calculatorAPI = {
  saveResult: (resultData) =>
    apiCall("/CalculatorResults", {
      method: "POST",
      body: JSON.stringify(resultData),
    }),

  getUserResults: (username) =>
    apiCall(`/CalculatorResults/user/${encodeURIComponent(username)}`, {
      method: "GET",
    }),

  getResultById: (id) =>
    apiCall(`/CalculatorResults/${id}`, {
      method: "GET",
    }),

  deleteResult: (id) =>
    apiCall(`/CalculatorResults/${id}`, {
      method: "DELETE",
    }),
};

/**
 * Scholarship APIs
 */
export const scholarshipAPI = {
  getAllScholarships: () => apiCall("/Scholarships", { method: "GET" }),

  filterByMajor: (major) =>
    apiCall(`/Scholarships/filterByMajor/${encodeURIComponent(major)}`, {
      method: "GET",
    }),

  sortByDate: (ascending = true) =>
    apiCall(`/Scholarships/sortByDate?ascending=${ascending}`, {
      method: "GET",
    }),

  // Admin: rewrite every listing's kind/category/subcategory/level to the
  // clean taxonomy. dryRun=true only reports what would change.
  normalizeCategories: (dryRun = true) =>
    apiCall(`/Scholarships/admin/normalize-categories?dryRun=${dryRun}`, { method: "POST" }),

  // Admin: add universities (source "hipo", needs a country) or jobs
  // (source "arbeitnow") from public APIs. dryRun=true only reports.
  importExternal: ({ source, country, limit, dryRun = true }) => {
    const params = new URLSearchParams({ source, limit: String(limit), dryRun: String(dryRun) });
    if (country) params.set("country", country);
    return apiCall(`/Scholarships/admin/import-external?${params.toString()}`, { method: "POST" });
  },

  removeImported: (source) =>
    apiCall(`/Scholarships/admin/import-external?source=${encodeURIComponent(source)}`, { method: "DELETE" }),

  // Paged + searchable admin listing — the only variant that doesn't load
  // the entire collection into memory on every call.
  getAdminPaged: ({ page = 1, pageSize = 20, search = "", major = "", ascending = false, kind = "" } = {}) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), ascending: String(ascending) });
    if (search.trim()) params.set("search", search.trim());
    if (major.trim()) params.set("major", major.trim());
    if (kind.trim()) params.set("kind", kind.trim());
    return apiCall(`/Scholarships/admin/paged?${params.toString()}`, { method: "GET" });
  },

  createScholarship: (scholarshipData) =>
    apiCall("/Scholarships", {
      method: "POST",
      body: JSON.stringify(scholarshipData),
    }),

  getScholarshipById: (id) => apiCall(`/Scholarships/${id}`, { method: "GET" }),

  updateScholarship: (id, scholarshipData) =>
    apiCall(`/Scholarships/${id}`, {
      method: "PUT",
      body: JSON.stringify(scholarshipData),
    }),

  deleteScholarship: (id) =>
    apiCall(`/Scholarships/${id}`, { method: "DELETE" }),

  reportScholarship: (id, description) =>
    apiCall(`/Scholarships/${id}/report`, {
      method: "POST",
      body: JSON.stringify({ description }),
    }),
};

export const adminExternalAPI = {
  searchUniversities: async (query) => {
    const response = await fetch(
      `https://universities.hipolabs.com/search?name=${encodeURIComponent(query)}`,
    );
    if (!response.ok) throw new Error(`University search failed (HTTP ${response.status}).`);
    return response.json();
  },

  searchRemoteJobs: async ({ query, category, limit = 40 }) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (query?.trim()) params.set("search", query.trim());
    if (category) params.set("category", category);
    const response = await fetch(`https://remotive.com/api/remote-jobs?${params.toString()}`);
    if (!response.ok) throw new Error(`Remote job search failed (HTTP ${response.status}).`);
    const data = await response.json();
    return Array.isArray(data?.jobs) ? data.jobs : [];
  },
};

/**
 * Payment APIs
 */
export const paymentAPI = {
  createPaymentIntent: (paymentData) =>
    apiCall("/Payments/create-intent", {
      method: "POST",
      body: JSON.stringify(paymentData),
    }),

  processPayment: (paymentData) =>
    apiCall("/Payments/process", {
      method: "POST",
      body: JSON.stringify(paymentData),
    }),
};

/**
 * Default export for backward compatibility
 */
export default {
  authAPI,
  scholarshipAPI,
  paymentAPI,
  apiCall,
};
