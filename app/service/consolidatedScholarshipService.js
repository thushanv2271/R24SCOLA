/**
 * Consolidated Scholarship Service
 * Dynamically filters scholarships by major
 * Replaces 20+ duplicate service files with a single dynamic service
 */

import { scholarshipAPI } from "../../services/apiService";

// Major categories supported
const MAJORS = {
  COMPUTER_SCIENCE: "computer Science",
  BUSINESS: "Business & Economics",
  ENGINEERING: "engineering",
  CHEMISTRY: "chemistry",
  HEALTH_SCIENCES: "health sciences",
  NATURAL_SCIENCES: "Natural Sciences",
  MATHEMATICS_STATISTICS: "Mathematics & Statistics",
  SOFTWARE_ENGINEERING: "software engineering",
};

/**
 * Get all scholarships
 */
export const getAllScholarships = async () => {
  try {
    return await scholarshipAPI.getAllScholarships();
  } catch (error) {
    console.error("Error fetching all scholarships:", error);
    throw error;
  }
};

/**
 * Get scholarships by major (dynamic)
 * @param {string} major - The major to filter by
 * @returns {Promise<Array>} Array of scholarship objects
 */
export const getScholarshipsByMajor = async (major) => {
  try {
    const scholarships = await scholarshipAPI.filterByMajor(major);
    return scholarships || [];
  } catch (error) {
    console.error(`Error fetching scholarships for ${major}:`, error);
    throw error;
  }
};

/**
 * Get computer science scholarships
 */
export const getComputerScienceScholarships = () =>
  getScholarshipsByMajor(MAJORS.COMPUTER_SCIENCE);

/**
 * Get business scholarships
 */
export const getBusinessScholarships = () =>
  getScholarshipsByMajor(MAJORS.BUSINESS);

/**
 * Get engineering scholarships
 */
export const getEngineeringScholarships = () =>
  getScholarshipsByMajor(MAJORS.ENGINEERING);

/**
 * Get chemistry scholarships
 */
export const getChemistryScholarships = () =>
  getScholarshipsByMajor(MAJORS.CHEMISTRY);

/**
 * Get health sciences scholarships
 */
export const getHealthSciencesScholarships = () =>
  getScholarshipsByMajor(MAJORS.HEALTH_SCIENCES);

/**
 * Get natural sciences scholarships
 */
export const getNaturalSciencesScholarships = () =>
  getScholarshipsByMajor(MAJORS.NATURAL_SCIENCES);

/**
 * Get mathematics & statistics scholarships
 */
export const getMathematicsStatisticsScholarships = () =>
  getScholarshipsByMajor(MAJORS.MATHEMATICS_STATISTICS);

/**
 * Get software engineering scholarships (masters level)
 */
export const getSoftwareEngineeringScholarships = () =>
  getScholarshipsByMajor(MAJORS.SOFTWARE_ENGINEERING);

/**
 * Export majors constant for use in other components
 */
export { MAJORS };

/**
 * Get sorted scholarships by date
 */
export const getSortedScholarships = async (ascending = true) => {
  try {
    return await scholarshipAPI.sortByDate(ascending);
  } catch (error) {
    console.error("Error fetching sorted scholarships:", error);
    throw error;
  }
};

export default {
  getAllScholarships,
  getScholarshipsByMajor,
  getComputerScienceScholarships,
  getBusinessScholarships,
  getEngineeringScholarships,
  getChemistryScholarships,
  getHealthSciencesScholarships,
  getNaturalSciencesScholarships,
  getMathematicsStatisticsScholarships,
  getSoftwareEngineeringScholarships,
  getSortedScholarships,
  MAJORS,
};
