/**
 * Centralized API Service
 * Handles all backend API calls with environment-based configuration
 */

const API_BASE_URL = 'https://webapplication2-old-pond-3577.fly.dev/api';

/**
 * Generic fetch wrapper with error handling
 */
const apiCall = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.text();
      let errorMessage = `HTTP ${response.status}`;
      try {
        const parsed = JSON.parse(errorData);
        errorMessage = parsed.message || errorMessage;
      } catch (e) {
        errorMessage = errorData || errorMessage;
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error at ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Authentication APIs
 */
export const authAPI = {
  checkUserExists: (email) => 
    apiCall(`/Users/${encodeURIComponent(email)}`, { method: 'GET' }),
  
  login: (credentials) => 
    apiCall('/Users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  
  register: (userData) => 
    apiCall('/Users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  
  getUserByEmail: (email) => 
    apiCall(`/Users/${encodeURIComponent(email)}`, { method: 'GET' }),
  
  updateUser: (userId, userData, token) => 
    apiCall(`/Users/${userId}`, {
      method: 'PUT',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: JSON.stringify(userData),
    }),
};

/**
 * Scholarship APIs
 */
export const scholarshipAPI = {
  getAllScholarships: () => 
    apiCall('/Scholarships', { method: 'GET' }),
  
  filterByMajor: (major) => 
    apiCall(`/Scholarships/filterByMajor/${encodeURIComponent(major)}`, { method: 'GET' }),
  
  sortByDate: (ascending = true) => 
    apiCall(`/Scholarships/sortByDate?ascending=${ascending}`, { method: 'GET' }),
  
  createScholarship: (scholarshipData) => 
    apiCall('/Scholarships', {
      method: 'POST',
      body: JSON.stringify(scholarshipData),
    }),
  
  getScholarshipById: (id) => 
    apiCall(`/Scholarships/${id}`, { method: 'GET' }),
  
  updateScholarship: (id, scholarshipData) => 
    apiCall(`/Scholarships/${id}`, {
      method: 'PUT',
      body: JSON.stringify(scholarshipData),
    }),
  
  deleteScholarship: (id) => 
    apiCall(`/Scholarships/${id}`, { method: 'DELETE' }),
};

/**
 * Payment APIs
 */
export const paymentAPI = {
  createPaymentIntent: (paymentData) => 
    apiCall('/Payments/create-intent', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),
  
  processPayment: (paymentData) => 
    apiCall('/Payments/process', {
      method: 'POST',
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
