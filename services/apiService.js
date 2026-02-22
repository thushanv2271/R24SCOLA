/**
 * Centralized API Service
 * Handles all backend API calls with environment-based configuration
 */

const API_BASE_URL = "https://webapplication2-old-pond-3577.fly.dev/api";

/**
 * Generic fetch wrapper with error handling
 */
const apiCall = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.text();
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(errorData);
          if (parsed?.errors && typeof parsed.errors === "object") {
            const firstKey = Object.keys(parsed.errors)[0];
            const firstError = parsed.errors[firstKey]?.[0];
            errorMessage = firstError || parsed.title || parsed.message || errorMessage;
          } else {
            errorMessage = parsed.message || parsed.title || errorMessage;
          }
        } catch (e) {
          // If not JSON, use the text directly (remove quotes if present)
          errorMessage = errorData.replace(/^"+|"+$/g, "") || errorMessage;
        }
      } catch (e) {
        // If reading response fails, use status code
      }
      const httpError = new Error(errorMessage);
      httpError.status = response.status;
      httpError.endpoint = endpoint;
      throw httpError;
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    const status = error?.status;
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
    apiCall(`/Users/${encodeURIComponent(username)}`, { method: "GET" }),

  login: (credentials) =>
    apiCall("/Users/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  register: (userData) =>
    apiCall("/Users/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  getUserByUsername: (username) =>
    apiCall(`/Users/${encodeURIComponent(username)}`, { method: "GET" }),

  updateUser: (userId, userData, token) =>
    apiCall(`/Users/${userId}`, {
      method: "PUT",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(userData),
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
    apiCall(`/Users/${encodeURIComponent(username)}/job-favorites/by-username`, {
      method: "POST",
      body: JSON.stringify(jobId),
    }),

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
