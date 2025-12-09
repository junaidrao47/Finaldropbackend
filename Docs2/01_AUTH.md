# 🔐 Authentication Module API

## Overview
Authentication endpoints for user registration, login, social authentication, and session management.

**Base Path:** `/auth`  
**Authentication Required:** ❌ Most endpoints are public

---

## Endpoints

### 1. Register New User

**POST** `/auth/register`

Register a new user account with email and password.

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "displayName": "John Doe"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Error Response (400)
```json
{
  "statusCode": 400,
  "message": "Email is already registered",
  "error": "Bad Request"
}
```

---

### 2. Login

**POST** `/auth/login`

Authenticate with email/phone and password.

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "rememberMe": true
}
```

**Alternative (Phone Login):**
```json
{
  "emailOrPhone": "+1234567890",
  "password": "SecurePass123!",
  "rememberMe": false
}
```

#### Success Response (200)
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "displayName": "John Doe"
  }
}
```

#### Error Response (401)
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

---

### 3. Social Login (Firebase)

**POST** `/auth/social`

Authenticate using Firebase OAuth (Google, Facebook, Apple).

#### Request Body
```json
{
  "provider": "firebase",
  "accessToken": "firebase_id_token_from_frontend",
  "deviceFingerprint": "unique_device_id",
  "deviceName": "iPhone 13"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "isNewUser": false,
  "requiresPhoneVerification": false,
  "user": {
    "id": "1",
    "email": "user@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "displayName": "John Doe",
    "profileImage": "https://lh3.googleusercontent.com/..."
  }
}
```

---

### 4. Google Login (Shortcut)

**POST** `/auth/google`

Quick Google authentication endpoint.

#### Request Body
```json
{
  "accessToken": "google_access_token",
  "deviceFingerprint": "device_id"
}
```

#### Success Response (200)
Same as social login response.

---

### 5. Facebook Login (Shortcut)

**POST** `/auth/facebook`

Quick Facebook authentication endpoint.

#### Request Body
```json
{
  "accessToken": "facebook_access_token",
  "deviceFingerprint": "device_id"
}
```

#### Success Response (200)
Same as social login response.

---

### 6. Apple Sign-In (Shortcut)

**POST** `/auth/apple`

Quick Apple authentication endpoint.

#### Request Body
```json
{
  "accessToken": "apple_access_token",
  "idToken": "apple_id_token",
  "deviceFingerprint": "device_id"
}
```

#### Success Response (200)
Same as social login response.

---

### 7. Forgot Password

**POST** `/auth/forgot-password`

Request password reset link via email.

#### Request Body
```json
{
  "email": "user@example.com"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "If an account exists with this email, you will receive a password reset link"
}
```

---

### 8. Reset Password

**POST** `/auth/reset-password`

Reset password using token from email.

#### Request Body
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass123!"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

#### Error Response (400)
```json
{
  "statusCode": 400,
  "message": "Invalid or expired reset token",
  "error": "Bad Request"
}
```

---

### 9. Logout

**POST** `/auth/logout`  
🔒 **Authentication Required**

Logout current session and invalidate tokens.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 10. Refresh Token

**POST** `/auth/refresh`

Get new access token using refresh token.

#### Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Success Response (200)
```json
{
  "accessToken": "new_access_token",
  "refreshToken": "new_refresh_token"
}
```

---

### 11. Switch Organization

**POST** `/auth/switch-organization`  
🔒 **Authentication Required**

Switch to a different organization context.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Request Body
```json
{
  "organizationId": 5
}
```

#### Success Response (200)
```json
{
  "accessToken": "new_token_with_org_context",
  "refreshToken": "new_refresh_token",
  "organizationId": 5
}
```

#### Error Response (401)
```json
{
  "statusCode": 401,
  "message": "User does not have access to this organization",
  "error": "Unauthorized"
}
```

---

### 12. Get Current User

**GET** `/auth/me`  
🔒 **Authentication Required**

Get current authenticated user information.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Success Response (200)
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "displayName": "John Doe",
    "organizationId": 3,
    "roleId": 2,
    "isActive": true
  }
}
```

---

## Testing Examples

### cURL Examples

**Register:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "+1234567890"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "rememberMe": true
  }'
```

**Get Current User:**
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Validation Rules

### Email
- Must be valid email format
- Unique across system
- Max 254 characters

### Password
- Minimum 8 characters
- Must contain: uppercase, lowercase, digit, special character
- Cannot be common passwords

### Phone Number
- E.164 international format
- Example: `+1234567890`

---

## Token Lifetimes

| Token Type | Default | With "Remember Me" |
|------------|---------|-------------------|
| Access Token | 15 minutes | 7 days |
| Refresh Token | 7 days | 30 days |

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Invalid credentials or token |
| 403 | Forbidden | Insufficient permissions |
| 409 | Conflict | Email already exists |
| 500 | Internal Server Error | Server error |

---

**Next:** [Users Module →](./02_USERS.md)
