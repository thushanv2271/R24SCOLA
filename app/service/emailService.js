import { Linking, Alert } from "react-native";
import { authAPI } from "../../services/apiService";

export const sendScholarshipEmail = async (
  professorEmail,
  userEmail,
  scholarshipTitle,
  professorDetails,
) => {
  try {
    // Fetch the user's custom email message
    const messageData = await authAPI.getEmailMessage(userEmail);

    // Handle different response formats
    let customMessage = messageData?.scholarshipEmailMessage || messageData;

    // If it's a string response wrapped in quotes, remove them
    if (typeof customMessage === "string") {
      if (customMessage.startsWith('"') && customMessage.endsWith('"')) {
        customMessage = customMessage.slice(1, -1);
      }
      // Replace literal \n with actual newlines
      customMessage = customMessage.replace(/\\n/g, "\n");
    }

    const recipient = professorEmail;
    const subject = `Scholarship request: ${scholarshipTitle}`;

    // Construct the email body with \n for line breaks
    const body =
      `Dear ${professorDetails?.name || "Professor"},\n\n` +
      `${customMessage}\n\n`;

    // Encode the body for the mailto URL
    const encodedBody = encodeURIComponent(body);

    // Construct the mailto URL
    const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodedBody}`;

    console.log("Mailto URL:", mailtoUrl);
    console.log("Decoded body for debugging:", decodeURIComponent(encodedBody));

    await Linking.openURL(mailtoUrl);
  } catch (error) {
    console.error("Error sending email:", error);
    Alert.alert(
      "Error",
      "Unable to open the email client or fetch custom message.",
    );
  }
};
