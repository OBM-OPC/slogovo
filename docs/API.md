# Slogovo API Documentation

## Authentication

All authenticated endpoints require a valid JWT token in the `Cookie: token=<jwt>` header.

### Register

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "name": "Max Mustermann",
  "email": "max@example.com",
  "password": "MySecure123!",
  "confirmPassword": "MySecure123!"
}
```

**Response (201):**
```json
{
  "message": "Registrierung erfolgreich",
  "user": {
    "id": "...",
    "email": "max@example.com",
    "name": "Max Mustermann"
  }
}
```

### Login

Authenticate an existing user.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "max@example.com",
  "password": "MySecure123!"
}
```

**Response (200):**
```json
{
  "message": "Login erfolgreich",
  "user": {
    "id": "...",
    "email": "max@example.com",
    "name": "Max Mustermann"
  }
}
```

**Note:** Sets an HTTP-only cookie `token` with the JWT.

### Logout

Terminate the current session.

**Endpoint:** `POST /api/auth/logout`

**Response (200):**
```json
{
  "message": "Logout erfolgreich"
}
```

### Get Current User

Fetch the authenticated user's profile.

**Endpoint:** `GET /api/auth/me`

**Response (200):**
```json
{
  "user": {
    "id": "...",
    "email": "max@example.com",
    "name": "Max Mustermann",
    "image": null,
    "displayName": null,
    "bio": null,
    "createdAt": "2026-06-29T..."
  }
}
```

### Forgot Password

Request a password reset email.

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "max@example.com"
}
```

**Response (200):**
```json
{
  "message": "Wenn ein Konto existiert, wurde eine E-Mail gesendet"
}
```

### Reset Password

Reset password using the token from the email.

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "abc123...",
  "password": "NewSecure456!"
}
```

**Response (200):**
```json
{
  "message": "Passwort erfolgreich zurückgesetzt"
}
```

## OAuth

Slogovo supports OAuth via NextAuth.js at `/api/auth/[...nextauth]`.

### Supported Providers
- Google
- Apple

### OAuth Flow
1. Initiate OAuth: `GET /api/auth/signin`
2. Callback: `GET /api/auth/callback/:provider`
3. Sign out: `POST /api/auth/signout`

## Error Responses

All errors follow this format:

```json
{
  "error": "Human-readable error message"
}
```

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Invalid credentials |
| 404 | Not Found - User not found |
| 409 | Conflict - User already exists |
| 500 | Server Error |
