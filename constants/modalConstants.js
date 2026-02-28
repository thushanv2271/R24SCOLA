// Constants for modal components to prevent recreation on render
// Note: Image sources must be required directly in component files for React Native

export const INSTRUCTION_SLIDES = [
  {
    id: 1,
    title: "Welcome to Scola!   ",
    description:
      "Login to request scholarships and manage your applications.   ",
  },
  {
    id: 2,
    title: "Request a Scholarship   ",
    description:
      'Click the "Request Scholarship" button to start your application.   ',
  },
  {
    id: 3,
    title: "View Your Request   ",
    description:
      "Check your email template and send your request directly to the university.   ",
  },
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: "Registration Successful",
    description: "Your account has been successfully created.",
    time: "Just now",
  },
  {
    id: 2,
    title: "Account Activity Alert",
    description: "There was a recent login to your account from a new device.",
    time: "10 minutes ago",
  },
  {
    id: 3,
    title: "New Scholarship Opportunity",
    description:
      "A new scholarship opportunity from Stanford University is available.",
    time: "1 hour ago",
  },
  {
    id: 4,
    title: "Upcoming Deadline",
    description:
      "The application deadline for Yale University scholarship is approaching.",
    time: "2 hours ago",
  },
];
