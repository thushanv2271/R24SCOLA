# Dashboard Authentication Setup

## Overview

The ScolaDashboard now has authentication integrated with the backend API.

## Changes Made

### 1. Authentication Context (`src/contexts/AuthContext.tsx`)

- Manages user authentication state
- Stores JWT token in localStorage
- Provides login/logout functionality
- Automatically restores session on page reload

### 2. Updated Sign-In Page (`src/sections/auth/sign-in-view.tsx`)

- Now makes actual API calls to backend `/api/Users/login`
- Displays error messages for invalid credentials
- Stores JWT token upon successful login
- Redirects to dashboard after login

### 3. Protected Routes (`src/components/protected-route/ProtectedRoute.tsx`)

- Wraps all dashboard routes
- Redirects to sign-in page if not authenticated
- Shows loading spinner while checking auth status

### 4. API Utils (`src/utils/api.ts`)

- Helper function `fetchWithAuth()` that automatically includes JWT token
- Used for all API calls to backend

### 5. Updated Components

- **Account Popover**: Now shows logged-in user's username and working logout button
- **Dashboard**: Displays personalized welcome message with username
- **Scholarship Management**: All API calls now include authentication headers

## How to Use

### Login

1. Navigate to `/sign-in`
2. Enter your **username** (not email) and password
3. Click "Sign in"
4. Upon success, you'll be redirected to the dashboard

### Create a Test Account

Use the backend API to register:

```bash
POST https://webapplication2-old-pond-3577.fly.dev/api/Users/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123",
  "age": 25,
  "country": "USA"
}
```

### Logout

- Click on your avatar in the top-right corner
- Click the "Logout" button
- You'll be redirected to the sign-in page

## API Endpoints Used

### Login

- **Endpoint**: `POST /api/Users/login`
- **Body**: `{ "username": "...", "password": "..." }`
- **Response**: `{ "token": "...", "id": "...", "username": "...", ... }`

### Logout

- **Endpoint**: `POST /api/Users/logout/{userId}`
- **Headers**: `Authorization: Bearer {token}`

### Scholarships

- **Base URL**: `/api/Scholarships`
- **Note**: These endpoints don't require authentication, but the app sends the token anyway for consistency

## Token Management

- JWT tokens are stored in `localStorage` with key `authToken`
- User data is stored in `localStorage` with key `authUser`
- Token is automatically included in all API requests via `fetchWithAuth()`
- Token is cleared on logout

## Security Notes

- All protected routes require authentication
- Login attempts are rate-limited on the backend
- Failed login attempts are tracked
- Passwords are hashed with BCrypt on the backend

## Troubleshooting

### "Invalid username or password" error

- Verify your credentials are correct
- Username must be 3-20 characters (letters, numbers, underscore only)
- Check if account is locked due to failed login attempts (15-minute lockout after 5 failed attempts)

### Redirected to login page unexpectedly

- Token may have expired
- localStorage may have been cleared
- Try logging in again

### API calls failing

- Check browser console for errors
- Verify backend is running at `https://webapplication2-old-pond-3577.fly.dev`
- Check if token is present in localStorage
