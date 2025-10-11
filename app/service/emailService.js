import { Linking, Alert } from "react-native";

export const sendScholarshipEmail = async (
  professorEmail,
  userEmail,
  scholarshipTitle,
  professorDetails
) => {
  try {
    // Fetch the user's custom email message
    const response = await fetch(
      `https://webapplication2-old-pond-3577.fly.dev/api/Users/${encodeURIComponent(
        userEmail
      )}/email-message`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch email message");
    }

    // Get the custom message as plain text
    let customMessage = await response.text();

    // Remove surrounding double quotes if they exist
    if (customMessage.startsWith('"') && customMessage.endsWith('"')) {
      customMessage = customMessage.slice(1, -1);
    }

    // Replace literal \n with actual newlines
    customMessage = customMessage.replace(/\\n/g, "\n");

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
      subject
    )}&body=${encodedBody}`;

    console.log("Mailto URL:", mailtoUrl);
    console.log("Decoded body for debugging:", decodeURIComponent(encodedBody));

    await Linking.openURL(mailtoUrl);
  } catch (error) {
    console.error("Error sending email:", error);
    Alert.alert(
      "Error",
      "Unable to open the email client or fetch custom message."
    );
  }
};