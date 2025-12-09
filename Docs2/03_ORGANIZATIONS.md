# 🏢 Organizations Module API

## Overview
Organization management, logo uploads, and file handling.

**Base Path:** `/organizations`  
**Authentication Required:** 🔒 Yes (all endpoints)

---

## Endpoints

### 1. Create Organization

**POST** `/organizations`  
👑 **Admin Role Required**

Create a new organization.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "name": "Acme Logistics Inc.",
  "description": "Full-service logistics and warehouse management company"
}
```

#### Success Response (201)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Acme Logistics Inc.",
  "description": "Full-service logistics and warehouse management company",
  "createdAt": "2025-12-09T10:30:00Z",
  "updatedAt": "2025-12-09T10:30:00Z"
}
```

#### Error Response (400)
```json
{
  "statusCode": 400,
  "message": "Organization name already exists",
  "error": "Bad Request"
}
```

#### Validation Rules
- `name`: Required, string, max 255 characters
- `description`: Required, string

---

### 2. Get All Organizations

**GET** `/organizations`

Retrieve all organizations.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Success Response (200)
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Acme Logistics Inc.",
    "description": "Full-service logistics and warehouse management company",
    "logoUrl": "https://res.cloudinary.com/finaldrop/image/upload/v123456/org_logos/550e8400.jpg",
    "createdAt": "2025-12-09T10:30:00Z",
    "updatedAt": "2025-12-09T10:30:00Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "FastShip Warehouse",
    "description": "Express shipping and distribution center",
    "logoUrl": null,
    "createdAt": "2025-12-08T14:20:00Z",
    "updatedAt": "2025-12-08T14:20:00Z"
  }
]
```

---

### 3. Get Organization by ID

**GET** `/organizations/:id`

Retrieve a specific organization by ID.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Organization ID |

#### Example Request
```http
GET /organizations/1
```

#### Success Response (200)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Acme Logistics Inc.",
  "description": "Full-service logistics and warehouse management company",
  "logoUrl": "https://res.cloudinary.com/finaldrop/image/upload/v123456/org_logos/550e8400.jpg",
  "warehouses": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440003",
      "name": "Main Warehouse",
      "location": "123 Industrial Blvd"
    }
  ],
  "usersCount": 45,
  "packagesCount": 1250,
  "createdAt": "2025-12-09T10:30:00Z",
  "updatedAt": "2025-12-09T10:30:00Z"
}
```

#### Error Response (404)
```json
{
  "statusCode": 404,
  "message": "Organization not found",
  "error": "Not Found"
}
```

---

### 4. Delete Organization

**DELETE** `/organizations/:id`  
👑 **Admin Role Required**

Delete an organization.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Organization ID |

#### Example Request
```http
DELETE /organizations/1
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Organization deleted successfully"
}
```

#### Error Response (404)
```json
{
  "statusCode": 404,
  "message": "Organization not found",
  "error": "Not Found"
}
```

#### Error Response (400)
```json
{
  "statusCode": 400,
  "message": "Cannot delete organization with active users or packages",
  "error": "Bad Request"
}
```

---

### 5. Switch Organization

**POST** `/organizations/:id/switch`

Switch user's active organization context.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Target organization ID |

#### Example Request
```http
POST /organizations/2/switch
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
    "organizationId": 2,
    "organization": {
      "id": 2,
      "name": "FastShip Warehouse"
    }
  }
}
```

#### Error Response (403)
```json
{
  "success": false,
  "message": "You do not have access to this organization"
}
```

---

### 6. Upload Organization Logo

**POST** `/organizations/:id/logo`  
👑 **Admin Role Required**

Upload or update organization logo.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Organization ID |

#### Form Data
| Field | Type | Description | Required |
|-------|------|-------------|----------|
| file | File | Image file (JPG, PNG, GIF, WebP, SVG) | ✅ |

#### Success Response (200)
```json
{
  "success": true,
  "message": "Logo uploaded successfully",
  "url": "https://res.cloudinary.com/finaldrop/image/upload/v123456/org_logos/550e8400.jpg",
  "publicId": "org_logos/550e8400",
  "format": "jpg",
  "width": 512,
  "height": 512,
  "size": 45678
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

#### Validation Rules
- **Accepted formats:** JPG, JPEG, PNG, GIF, WebP, SVG
- **Max file size:** 5MB
- **Recommended dimensions:** 512x512px (square)

---

### 7. Delete Organization Logo

**DELETE** `/organizations/:id/logo`  
👑 **Admin Role Required**

Remove organization logo.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Organization ID |

#### Success Response (200)
```json
{
  "success": true,
  "message": "Logo deleted successfully"
}
```

#### Error Response (404)
```json
{
  "statusCode": 404,
  "message": "Logo not found",
  "error": "Not Found"
}
```

---

### 8. Get Organization Files

**GET** `/organizations/:id/files`

Retrieve all files associated with an organization.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| id | integer | Organization ID |

#### Success Response (200)
```json
{
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "files": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440010",
      "packageId": "880e8400-e29b-41d4-a716-446655440020",
      "fileType": "photo",
      "fileTitle": "Package arrival photo",
      "url": "https://res.cloudinary.com/finaldrop/image/upload/v123456/packages/880e8400.jpg",
      "uploadedAt": "2025-12-09T11:15:00Z",
      "uploadedBy": "John Doe"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440011",
      "packageId": "880e8400-e29b-41d4-a716-446655440021",
      "fileType": "label",
      "fileTitle": "Shipping label",
      "url": "https://res.cloudinary.com/finaldrop/image/upload/v123456/labels/880e8400.pdf",
      "uploadedAt": "2025-12-09T11:20:00Z",
      "uploadedBy": "Jane Smith"
    }
  ],
  "total": 2
}
```

---

## cURL Testing Examples

### Create Organization
```bash
curl -X POST http://localhost:3000/organizations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Logistics Inc.",
    "description": "Full-service logistics and warehouse management company"
  }'
```

### Get All Organizations
```bash
curl -X GET http://localhost:3000/organizations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Organization by ID
```bash
curl -X GET http://localhost:3000/organizations/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Switch Organization
```bash
curl -X POST http://localhost:3000/organizations/2/switch \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Upload Organization Logo
```bash
curl -X POST http://localhost:3000/organizations/1/logo \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/logo.png"
```

### Delete Organization Logo
```bash
curl -X DELETE http://localhost:3000/organizations/1/logo \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Organization Files
```bash
curl -X GET http://localhost:3000/organizations/1/files \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Delete Organization
```bash
curl -X DELETE http://localhost:3000/organizations/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid input data or validation error |
| 401 | Unauthorized - Missing or invalid access token |
| 403 | Forbidden - Insufficient permissions (admin role required) |
| 404 | Not Found - Organization does not exist |
| 413 | Payload Too Large - File exceeds 5MB limit |
| 500 | Internal Server Error - Server-side error |

---

## Notes

- **Role Requirements:** Most endpoints require admin role except read operations and organization switching
- **File Upload:** Use `multipart/form-data` for logo uploads
- **Organization Context:** Users can belong to multiple organizations and switch between them
- **Cascading Deletes:** Deleting an organization may affect associated users and packages (check business rules)
- **Logo Storage:** Logos are stored in Cloudinary for optimal CDN delivery

---

## Navigation

[← Previous: Users Module](./02_USERS.md) | [Next: Packages Module →](./04_PACKAGES.md)

[Back to Index](./00_INDEX.md)
