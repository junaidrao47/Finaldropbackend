# 👥 Users Module API

## Overview
User management, profile operations, and avatar uploads.

**Base Path:** `/users`  
**Authentication Required:** 🔒 Yes (all endpoints)

---

## Endpoints

### 1. Create User

**POST** `/users`  
👑 **Admin Role Required**

Create a new user (admin only).

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "+1234567890",
  "organizationId": 1,
  "roleId": 2,
  "isActive": true
}
```

#### Success Response (201)
```json
{
  "id": 15,
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "+1234567890",
  "organizationId": 1,
  "roleId": 2,
  "isActive": true,
  "createdAt": "2025-12-09T10:30:00Z"
}
```

---

### 2. Get All Users

**GET** `/users`

List all users (paginated).

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | number | Page number | 1 |
| limit | number | Items per page | 10 |
| organizationId | number | Filter by organization | - |
| roleId | number | Filter by role | - |
| isActive | boolean | Filter by active status | - |

#### Example Request
```http
GET /users?page=1&limit=20&organizationId=1&isActive=true
```

#### Success Response (200)
```json
{
  "data": [
    {
      "id": 1,
      "email": "user1@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "+1234567890",
      "organizationId": 1,
      "roleId": 2,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "email": "user2@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "phoneNumber": "+1987654321",
      "organizationId": 1,
      "roleId": 3,
      "isActive": true,
      "createdAt": "2025-01-02T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### 3. Get Current User (Me)

**GET** `/users/me`

Get current authenticated user's profile.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Success Response (200)
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "displayName": "John Doe",
  "phoneNumber": "+1234567890",
  "organizationId": 1,
  "organization": {
    "id": 1,
    "name": "Acme Corp"
  },
  "roleId": 2,
  "role": {
    "id": 2,
    "name": "manager"
  },
  "isActive": true,
  "profileImage": "https://res.cloudinary.com/...",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-12-09T10:30:00Z"
}
```

---

### 4. Get User by ID

**GET** `/users/:id`

Get specific user details.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Example Request
```http
GET /users/5
```

#### Success Response (200)
```json
{
  "id": 5,
  "email": "user5@example.com",
  "firstName": "Alice",
  "lastName": "Johnson",
  "phoneNumber": "+1234567890",
  "organizationId": 1,
  "roleId": 2,
  "isActive": true,
  "createdAt": "2025-01-15T00:00:00Z"
}
```

#### Error Response (404)
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

---

### 5. Get User Organizations

**GET** `/users/:id/organizations`

Get list of organizations a user belongs to.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Example Request
```http
GET /users/5/organizations
```

#### Success Response (200)
```json
{
  "userId": 5,
  "organizations": [
    {
      "id": 1,
      "name": "Acme Corp",
      "role": "manager",
      "isActive": true,
      "joinedAt": "2025-01-15T00:00:00Z"
    },
    {
      "id": 3,
      "name": "Beta Industries",
      "role": "user",
      "isActive": true,
      "joinedAt": "2025-03-01T00:00:00Z"
    }
  ]
}
```

---

### 6. Update User

**PUT** `/users/:id`  
👑 **Admin Role Required**

Update user details.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "firstName": "John",
  "lastName": "Updated",
  "phoneNumber": "+1999999999",
  "isActive": true
}
```

#### Success Response (200)
```json
{
  "id": 5,
  "email": "user5@example.com",
  "firstName": "John",
  "lastName": "Updated",
  "phoneNumber": "+1999999999",
  "isActive": true,
  "updatedAt": "2025-12-09T10:35:00Z"
}
```

---

### 7. Delete User

**DELETE** `/users/:id`  
👑 **Admin Role Required**

Soft delete a user.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Example Request
```http
DELETE /users/5
```

#### Success Response (204)
No content

---

### 8. Upload Avatar

**POST** `/users/me/avatar`

Upload profile picture/avatar.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

#### Request Body (Form Data)
```
file: <image_file>
```

#### Supported Formats
- JPG/JPEG
- PNG
- GIF
- WebP

#### Max File Size
5 MB

#### Success Response (200)
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/finaldrop/image/upload/v123456/users/1/avatar.jpg",
  "publicId": "users/1/avatar",
  "width": 800,
  "height": 800,
  "format": "jpg",
  "size": 245678
}
```

#### Error Response (400)
```json
{
  "statusCode": 400,
  "message": "Only image files are allowed",
  "error": "Bad Request"
}
```

---

### 9. Delete Avatar

**DELETE** `/users/me/avatar`

Remove profile picture.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Avatar deleted successfully"
}
```

---

### 10. Get My Files

**GET** `/users/me/files`

Get all files uploaded by current user.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | number | Page number | 1 |
| limit | number | Items per page | 20 |
| type | string | File type filter | all |

#### Success Response (200)
```json
{
  "data": [
    {
      "id": "file_123",
      "url": "https://res.cloudinary.com/...",
      "publicId": "users/1/documents/doc1",
      "type": "document",
      "format": "pdf",
      "size": 1024567,
      "uploadedAt": "2025-12-09T10:00:00Z"
    },
    {
      "id": "file_124",
      "url": "https://res.cloudinary.com/...",
      "publicId": "users/1/images/img1",
      "type": "image",
      "format": "jpg",
      "size": 456789,
      "uploadedAt": "2025-12-09T11:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

---

## Testing Examples

### cURL Examples

**Get Current User:**
```bash
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Upload Avatar:**
```bash
curl -X POST http://localhost:3000/users/me/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/avatar.jpg"
```

**Update User:**
```bash
curl -X PUT http://localhost:3000/users/5 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated",
    "lastName": "Name"
  }'
```

---

## Validation Rules

### Email
- Valid email format
- Unique in system
- Max 254 characters

### Password
- Min 8 characters
- Must contain: uppercase, lowercase, digit, special character

### Phone Number
- E.164 format: `+1234567890`
- 7-15 digits

### Avatar
- Formats: JPG, PNG, GIF, WebP
- Max size: 5 MB
- Recommended: Square image, 800x800px

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Admin role required |
| 404 | Not Found | User not found |
| 413 | Payload Too Large | File too large (>5MB) |

---

**Previous:** [← Authentication](./01_AUTH.md) | **Next:** [Organizations →](./03_ORGANIZATIONS.md)
