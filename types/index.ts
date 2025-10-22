/**
 * Core Type Definitions for Scholarships Application
 */

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  address?: string;
  profilePicture?: string;
  isPremium: boolean;
  favoriteScholarships: string[];
  appliedScholarships: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  confirmPassword: string;
}

// ============================================================================
// Scholarship Types
// ============================================================================

export type ScholarshipLevel = 'Bachelors' | 'Masters' | 'PhD';

export type ScholarshipMajor =
  | 'Computer Science'
  | 'Engineering'
  | 'Business'
  | 'Chemistry'
  | 'Health Science'
  | 'Natural Science'
  | 'Statistics'
  | 'All';

export type ScholarshipStatus = 'Open' | 'Closed' | 'Coming Soon';

export interface Scholarship {
  id: string;
  title: string;
  description: string;
  university: string;
  country: string;
  level: ScholarshipLevel;
  major: ScholarshipMajor;
  amount?: number;
  currency?: string;
  deadline: string;
  eligibility: string[];
  requirements: string[];
  benefits: string[];
  applicationLink: string;
  status: ScholarshipStatus;
  isFeatured: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScholarshipFilters {
  level?: ScholarshipLevel[];
  major?: ScholarshipMajor[];
  country?: string[];
  minAmount?: number;
  maxAmount?: number;
  status?: ScholarshipStatus[];
  search?: string;
}

// ============================================================================
// Job Types
// ============================================================================

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  description: string;
  requirements: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  applicationLink: string;
  postedDate: string;
  deadline?: string;
}

// ============================================================================
// Navigation Types
// ============================================================================

export type RootStackParamList = {
  '(tabs)': undefined;
  login: undefined;
  RegisterForm: undefined;
  instructions: undefined;
  Profile: undefined;
  Chemistry: undefined;
  ComputerScience: undefined;
  Business: undefined;
  Engineering: undefined;
  HealthScience: undefined;
  NaturalScience: undefined;
  Statistics: undefined;
  MChemistry: undefined;
  MComputerScience: undefined;
  MBusiness: undefined;
  MEngineering: undefined;
  MHealthScience: undefined;
  MNaturalScience: undefined;
  MStatistics: undefined;
  PChemistry: undefined;
  PComputerScience: undefined;
  PBusiness: undefined;
  PEngineering: undefined;
  PHealthScience: undefined;
  PNaturalScience: undefined;
  PStatistics: undefined;
  BachalorsInside: { scholarship: Scholarship };
  MastersInside: { scholarship: Scholarship };
  PhdInside: { scholarship: Scholarship };
  Itjobs: undefined;
  JobInside: { job: Job };
  CustomMail: { scholarship: Scholarship };
  ScholarshipCalculator: undefined;
  ScholarshipCreateNew: undefined;
  Info: undefined;
  Community: undefined;
};

export type TabParamList = {
  index: undefined;
  Scholarships: undefined;
  favourites: undefined;
  premium: undefined;
  Profile: undefined;
};

// ============================================================================
// Component Props Types
// ============================================================================

export interface ScholarshipCardProps {
  scholarship: Scholarship;
  onPress?: (scholarship: Scholarship) => void;
  onFavorite?: (scholarshipId: string) => void;
  isFavorite?: boolean;
  showActions?: boolean;
}

export interface FilterModalProps {
  visible: boolean;
  filters: ScholarshipFilters;
  onApply: (filters: ScholarshipFilters) => void;
  onClose: () => void;
}

export interface LoaderModalProps {
  visible: boolean;
  message?: string;
}

export interface BottomModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number | string;
}

export interface NotificationModalProps {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
  duration?: number;
}

// ============================================================================
// API Types
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================================================
// Form Types
// ============================================================================

export interface EmailFormData {
  to: string;
  subject: string;
  body: string;
  scholarshipId?: string;
}

export interface PaymentFormData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  billingAddress: string;
}

export interface ScholarshipCalculatorData {
  gpa: number;
  testScore?: number;
  income: number;
  country: string;
  level: ScholarshipLevel;
  major: ScholarshipMajor;
}

// ============================================================================
// Utility Types
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  status: LoadingState;
  error: string | null;
}

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface Theme {
  mode: ThemeMode;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
  };
}
