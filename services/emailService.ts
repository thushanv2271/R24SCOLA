/**
 * Email Service - Refactored with TypeScript
 */

import { apiClient } from '@/utils/apiClient';
import { API_ENDPOINTS } from '@/config/api';
import type { EmailFormData } from '@/types';

/**
 * Send email
 */
export const sendEmail = async (emailData: EmailFormData): Promise<void> => {
  try {
    await apiClient.post(API_ENDPOINTS.SEND_EMAIL, emailData);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Could not send email. Please try again later.');
  }
};

/**
 * Send scholarship application email
 */
export const sendScholarshipApplicationEmail = async (
  to: string,
  scholarshipTitle: string,
  scholarshipId: string,
  customMessage?: string
): Promise<void> => {
  const subject = `Application for ${scholarshipTitle}`;
  const body = customMessage || `
I am writing to express my interest in the ${scholarshipTitle} scholarship.

I believe I am a strong candidate for this scholarship because of my academic achievements, dedication to my field of study, and commitment to making a positive impact in my community.

I have attached my application documents for your review. Please let me know if you need any additional information.

Thank you for your consideration.

Best regards
  `.trim();

  return sendEmail({
    to,
    subject,
    body,
    scholarshipId,
  });
};

// Default export
export default {
  sendEmail,
  sendScholarshipApplicationEmail,
};
