import { authAPI } from "./apiService";

export const fetchUserByUsername = async (username) => {
  try {
    return await authAPI.getUserByUsername(username);
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

export const updateUser = async (userId, userData, token) => {
  try {
    return await authAPI.updateUser(userId, userData, token);
  } catch (error) {
    console.error("Error updating user data:", error);
    throw error;
  }
};
