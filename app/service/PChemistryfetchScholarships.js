// services/scholarshipService.js

const API_BASE_URL = "https://webapplication2-old-pond-3577.fly.dev/api";

export const fetchScholarships = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/Scholarships/filterByMajor/chemistry`);
    if (!response.ok) throw new Error("Failed to fetch scholarships.");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw new Error("Could not fetch scholarship data.");
  }
};