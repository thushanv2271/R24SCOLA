import { Linking } from "react-native";
import * as MailComposer from "expo-mail-composer";
import { authAPI } from "./apiService";
import { getAttachments } from "./attachmentStorage";

// Common named HTML entities that can appear in the rich-text editor's output.
const HTML_ENTITIES = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
};

// mailto: links only render plain text, so this is the fallback path's way of
// flattening the editor's HTML into readable text (bold/italic/etc. have no
// plain-text form, so those tags are just dropped).
const htmlToPlainText = (html) => {
  if (!html) return "";

  let text = html
    .replace(/<\/(p|div|h[1-3]|blockquote)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "$2 ($1)")
    .replace(/<img[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "");

  text = text.replace(/&[a-z#0-9]+;/gi, (entity) => HTML_ENTITIES[entity] ?? entity);

  return text.replace(/\n{3,}/g, "\n\n").trim();
};

// Opens the device's mail app with the recipient/subject/body pre-filled and
// lets the user review and tap Send themselves. Uses expo-mail-composer so
// the bold/italic/underline/lists/links the user added in the rich-text
// editor actually render as real formatting in the compose screen (mailto:
// links can't do this — they're plain-text only), falling back to mailto:
// (plain text) only if no mail app is configured on the device.
const openMailComposer = async (
  recipients,
  subject,
  messageHtml,
  greetingName,
  fallbackGreeting,
  attachmentUris = [],
) => {
  const recipientList = Array.isArray(recipients) ? recipients : [recipients];
  const greeting = `<p>Dear ${greetingName || fallbackGreeting},</p>`;
  const htmlBody = `${greeting}${messageHtml || ""}`;

  const isAvailable = await MailComposer.isAvailableAsync();
  if (isAvailable) {
    await MailComposer.composeAsync({
      recipients: recipientList,
      subject,
      body: htmlBody,
      isHtml: true,
      attachments: attachmentUris,
    });
    return;
  }

  // No mail app registered with the OS (rare, but happens on some emulators).
  // mailto: links can't carry attachments or HTML, so this fallback only
  // gets the plain-text message through — attachments are silently dropped.
  if (attachmentUris.length > 0) {
    console.warn(
      "No mail app available via expo-mail-composer; attachments cannot be included in the mailto: fallback.",
    );
  }
  const plainBody =
    `Dear ${greetingName || fallbackGreeting},\n\n` +
    `${htmlToPlainText(messageHtml)}\n\n`;
  const mailtoUrl = `mailto:${recipientList.join(",")}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(plainBody)}`;
  await Linking.openURL(mailtoUrl);
};

export const sendScholarshipEmail = async (
  professorEmail,
  username,
  scholarshipTitle,
  professorDetails,
) => {
  try {
    if (!professorEmail) {
      return { success: false, error: "This professor has no email on file." };
    }

    const messageData = await authAPI.getEmailMessage(username);
    const customMessage = messageData?.scholarshipEmailMessage ?? messageData;
    const attachments = await getAttachments(username, "scholarships");

    await openMailComposer(
      professorEmail,
      `Scholarship request: ${scholarshipTitle}`,
      customMessage,
      professorDetails?.name,
      "Professor",
      attachments.map((attachment) => attachment.uri),
    );
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: "Unable to open the email client or fetch custom message.",
    };
  }
};

// "Request All" from Favourites: one compose screen addressed to every
// recipient in the batch, using the user's saved scholarship template.
export const sendBulkScholarshipEmail = async (recipientEmails, username, batchTitle) => {
  try {
    const emails = (recipientEmails || []).filter(Boolean);
    if (emails.length === 0) {
      return { success: false, error: "None of these scholarships have a contact email on file." };
    }

    const messageData = await authAPI.getEmailMessage(username);
    const customMessage = messageData?.scholarshipEmailMessage ?? messageData;
    const attachments = await getAttachments(username, "scholarships");

    await openMailComposer(
      emails,
      batchTitle || "Scholarship request",
      customMessage,
      null,
      "Professor",
      attachments.map((attachment) => attachment.uri),
    );
    return { success: true };
  } catch (error) {
    console.error("Error sending bulk scholarship email:", error);
    return {
      success: false,
      error: "Unable to open the email client or fetch custom message.",
    };
  }
};

export const sendBulkJobEmail = async (recipientEmails, username, batchTitle) => {
  try {
    const emails = (recipientEmails || []).filter(Boolean);
    if (emails.length === 0) {
      return { success: false, error: "None of these jobs have a contact email on file." };
    }

    const messageData = await authAPI.getJobEmailMessage(username);
    const customMessage = messageData?.jobEmailMessage ?? messageData;
    const attachments = await getAttachments(username, "jobs");

    await openMailComposer(
      emails,
      batchTitle || "Job application",
      customMessage,
      null,
      "Hiring Manager",
      attachments.map((attachment) => attachment.uri),
    );
    return { success: true };
  } catch (error) {
    console.error("Error sending bulk job email:", error);
    return {
      success: false,
      error: "Unable to open the email client or fetch custom message.",
    };
  }
};

export const sendJobEmail = async (
  companyEmail,
  username,
  jobTitle,
  companyDetails,
) => {
  try {
    if (!companyEmail) {
      return { success: false, error: "This listing has no contact email on file." };
    }

    const messageData = await authAPI.getJobEmailMessage(username);
    const customMessage = messageData?.jobEmailMessage ?? messageData;
    const attachments = await getAttachments(username, "jobs");

    await openMailComposer(
      companyEmail,
      `Job Application: ${jobTitle}`,
      customMessage,
      companyDetails?.name,
      "Hiring Manager",
      attachments.map((attachment) => attachment.uri),
    );
    return { success: true };
  } catch (error) {
    console.error("Error sending job email:", error);
    return {
      success: false,
      error: "Unable to open the email client or fetch custom message.",
    };
  }
};
