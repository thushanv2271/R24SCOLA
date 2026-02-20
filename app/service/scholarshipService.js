// DEPRECATED: Use ConsolidatedScholarshipService.js instead
// This file is kept for backward compatibility

import { getAllScholarships } from "./ConsolidatedScholarshipService";

export const fetchScholarships = async () => {
  try {
    return await getAllScholarships();
  } catch (error) {
    console.error(error);
    throw new Error("Could not fetch scholarship data.");
  }
};

