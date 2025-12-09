# 📦 Packages Module API

## Overview
Comprehensive package management including CRUD operations, scanning, file uploads, remarks, transfers, and bulk actions.

**Base Path:** `/packages`  
**Authentication Required:** 🔒 Yes (JWT required for all endpoints)

---

## Table of Contents
- [Package CRUD](#package-crud)
- [Package Search & Stats](#package-search--stats)
- [Scanning Operations](#scanning-operations)
- [Remarks Management](#remarks-management)
- [File Management](#file-management)
- [Transfer History](#transfer-history)
- [Bulk Operations](#bulk-operations)
- [Storage Location](#storage-location)

---

## Package CRUD

### 1. Create Package

**POST** `/packages`

Create a new package/shipment record.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "transactionType": "receive",
  "transactionStatus": "pending_receipt",
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "carrierId": "660e8400-e29b-41d4-a716-446655440001",
  "trackingNumber": "1Z999AA10123456784",
  "senderName": "John Smith",
  "senderPhone": "+1234567890",
  "recipientName": "Jane Doe",
  "recipientPhone": "+0987654321",
  "recipientAddress": "456 Elm St, Suite 200, Los Angeles, CA 90001",
  "numberOfPackages": 1,
  "declaredValue": 299.99,
  "weight": 5.5,
  "weightUnit": "lbs",
  "dimensions": "12x10x8",
  "contentDescription": "Electronic devices",
  "specialInstructions": "Handle with care, fragile contents",
  "requiresSignature": true,
  "isFragile": true,
  "isHazardous": false,
  "expectedDeliveryDate": "2025-12-15T14:00:00Z",
  "warehouseId": "770e8400-e29b-41d4-a716-446655440003",
  "storageLocation": "A-12-3-B"
}
```

#### Success Response (201)
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440020",
  "transactionType": "receive",
  "transactionStatus": "pending_receipt",
  "trackingNumber": "1Z999AA10123456784",
  "senderName": "John Smith",
  "recipientName": "Jane Doe",
  "weight": 5.5,
  "weightUnit": "lbs",
  "declaredValue": 299.99,
  "requiresSignature": true,
  "isFragile": true,
  "storageLocation": "A-12-3-B",
  "createdAt": "2025-12-09T10:30:00Z",
  "createdBy": 1
}
```

#### Error Response (400)
```json
{
  "statusCode": 400,
  "message": "Tracking number already exists",
  "error": "Bad Request"
}
```

---

### 2. Get All Packages (With Filters)

**GET** `/packages`

Retrieve packages with optional filtering, sorting, and pagination.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| search | string | Search by tracking number, recipient name | - |
| transactionType | string | receive, deliver, return | - |
| transactionStatus | string | pending_receipt, received, delivered, etc. | - |
| carrierId | UUID | Filter by carrier | - |
| organizationId | UUID | Filter by organization | - |
| warehouseId | UUID | Filter by warehouse | - |
| dateFrom | ISO 8601 | Start date filter | - |
| dateTo | ISO 8601 | End date filter | - |
| page | number | Page number | 1 |
| limit | number | Items per page | 10 |
| sortBy | string | Field to sort by | createdAt |
| sortOrder | string | asc or desc | desc |

#### Example Request
```http
GET /packages?transactionType=receive&transactionStatus=received&page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

#### Success Response (200)
```json
{
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440020",
      "trackingNumber": "1Z999AA10123456784",
      "transactionType": "receive",
      "transactionStatus": "received",
      "carrier": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "UPS"
      },
      "recipientName": "Jane Doe",
      "weight": 5.5,
      "weightUnit": "lbs",
      "storageLocation": "A-12-3-B",
      "createdAt": "2025-12-09T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 156,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

### 3. Get Package by ID

**GET** `/packages/:id`

Retrieve detailed information about a specific package.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Success Response (200)
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440020",
  "trackingNumber": "1Z999AA10123456784",
  "transactionType": "receive",
  "transactionStatus": "in_storage",
  "organization": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Acme Logistics"
  },
  "carrier": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "UPS",
    "trackingUrl": "https://www.ups.com/track?tracknum=1Z999AA10123456784"
  },
  "senderName": "John Smith",
  "senderPhone": "+1234567890",
  "recipientName": "Jane Doe",
  "recipientPhone": "+0987654321",
  "recipientAddress": "456 Elm St, Suite 200, Los Angeles, CA 90001",
  "numberOfPackages": 1,
  "weight": 5.5,
  "weightUnit": "lbs",
  "dimensions": "12x10x8",
  "declaredValue": 299.99,
  "contentDescription": "Electronic devices",
  "specialInstructions": "Handle with care, fragile contents",
  "requiresSignature": true,
  "isFragile": true,
  "isHazardous": false,
  "warehouse": {
    "id": "770e8400-e29b-41d4-a716-446655440003",
    "name": "Main Warehouse",
    "location": "123 Industrial Blvd"
  },
  "storageLocation": "A-12-3-B",
  "expectedDeliveryDate": "2025-12-15T14:00:00Z",
  "actualDeliveryDate": null,
  "createdAt": "2025-12-09T10:30:00Z",
  "updatedAt": "2025-12-09T11:45:00Z",
  "createdBy": 1,
  "updatedBy": 1
}
```

---

### 4. Update Package

**PUT** `/packages/:id`

Update package information.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "recipientPhone": "+0987654322",
  "recipientAddress": "456 Elm St, Suite 201, Los Angeles, CA 90001",
  "specialInstructions": "Deliver to front desk",
  "expectedDeliveryDate": "2025-12-16T10:00:00Z"
}
```

#### Success Response (200)
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440020",
  "trackingNumber": "1Z999AA10123456784",
  "recipientPhone": "+0987654322",
  "recipientAddress": "456 Elm St, Suite 201, Los Angeles, CA 90001",
  "specialInstructions": "Deliver to front desk",
  "expectedDeliveryDate": "2025-12-16T10:00:00Z",
  "updatedAt": "2025-12-09T12:30:00Z",
  "updatedBy": 1
}
```

---

### 5. Update Package Status

**PUT** `/packages/:id/status`

Update the transaction status of a package.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "status": "out_for_delivery"
}
```

#### Success Response (200)
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440020",
  "trackingNumber": "1Z999AA10123456784",
  "transactionStatus": "out_for_delivery",
  "previousStatus": "ready_for_pickup",
  "statusChangedAt": "2025-12-09T13:00:00Z",
  "statusChangedBy": 1
}
```

#### Valid Status Values
- `pending_receipt`
- `received`
- `in_storage`
- `ready_for_pickup`
- `out_for_delivery`
- `delivered`
- `delivery_failed`
- `return_requested`
- `cancelled`

---

### 6. Update Storage Location

**PUT** `/packages/:id/location`

Update the warehouse storage location of a package.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "zone": "A",
  "isle": "12",
  "shelf": "3",
  "bin": "C"
}
```

#### Success Response (200)
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440020",
  "storageLocation": "A-12-3-C",
  "updatedAt": "2025-12-09T13:15:00Z"
}
```

---

### 7. Restore Deleted Package

**POST** `/packages/:id/restore`

Restore a soft-deleted package.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Success Response (200)
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440020",
  "isDeleted": false,
  "restoredAt": "2025-12-09T13:30:00Z",
  "restoredBy": 1
}
```

---

### 8. Delete Package

**DELETE** `/packages/:id`

Soft delete a package (marks as deleted, doesn't remove from database).

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Success Response (204)
```
No Content
```

---

## Package Search & Stats

### 9. Search Packages

**GET** `/packages/search`

Search packages by tracking number, recipient name, or other criteria.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Query Parameters
| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| q | string | Search query | ✅ |
| organizationId | UUID | Limit to organization | ✅ |
| limit | number | Max results | ❌ (default: 20) |

#### Example Request
```http
GET /packages/search?q=1Z999AA&organizationId=550e8400-e29b-41d4-a716-446655440000&limit=10
```

#### Success Response (200)
```json
{
  "results": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440020",
      "trackingNumber": "1Z999AA10123456784",
      "recipientName": "Jane Doe",
      "transactionStatus": "in_storage",
      "storageLocation": "A-12-3-B"
    }
  ],
  "total": 1
}
```

---

### 10. Get Recent Packages

**GET** `/packages/recent/:organizationId`

Get recently created/updated packages for an organization.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| limit | number | Max results | 10 |

#### Example Request
```http
GET /packages/recent/550e8400-e29b-41d4-a716-446655440000?limit=5
```

#### Success Response (200)
```json
{
  "packages": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440020",
      "trackingNumber": "1Z999AA10123456784",
      "recipientName": "Jane Doe",
      "transactionStatus": "received",
      "createdAt": "2025-12-09T10:30:00Z"
    }
  ],
  "total": 5
}
```

---

### 11. Get Package Statistics

**GET** `/packages/stats/:organizationId`

Get package count statistics for dashboard.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| warehouseId | UUID | Filter by warehouse |

#### Example Request
```http
GET /packages/stats/550e8400-e29b-41d4-a716-446655440000?warehouseId=770e8400-e29b-41d4-a716-446655440003
```

#### Success Response (200)
```json
{
  "total": 1256,
  "byStatus": {
    "pending_receipt": 45,
    "received": 123,
    "in_storage": 567,
    "out_for_delivery": 89,
    "delivered": 412,
    "return_requested": 12,
    "cancelled": 8
  },
  "byType": {
    "receive": 890,
    "deliver": 320,
    "return": 46
  }
}
```

---

## Scanning Operations

### 12. Get Scan Page Configuration

**GET** `/packages/scan`

Get scan page UI configuration (for mobile/web scanner).

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Success Response (200)
```json
{
  "pageTitle": "Scan Package",
  "instruction": "Point your camera at the package's QR or barcode",
  "cameraSettings": {
    "enabled": true,
    "useDeviceCamera": true,
    "supportedFormats": ["QR_CODE", "CODE_128", "CODE_39", "EAN_13"]
  },
  "uploadOption": "Upload QR code or barcode",
  "actions": {
    "cancel": {
      "label": "Cancel",
      "action": "back_to_dashboard"
    }
  }
}
```

---

### 13. Scan Package (Main)

**POST** `/packages/scan`

Scan a package barcode/QR code and get package information.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "barcode": "1Z999AA10123456784",
  "format": "CODE_128",
  "timestamp": "2025-12-09T14:00:00Z",
  "deviceLocation": {
    "lat": 34.0522,
    "lng": -118.2437
  },
  "warehouseId": "770e8400-e29b-41d4-a716-446655440003"
}
```

#### Success Response (200) - Package Found
```json
{
  "status": "success",
  "message": "Package found",
  "packageId": "880e8400-e29b-41d4-a716-446655440020",
  "package": {
    "id": "880e8400-e29b-41d4-a716-446655440020",
    "trackingNumber": "1Z999AA10123456784",
    "recipientName": "Jane Doe",
    "transactionStatus": "in_storage",
    "storageLocation": "A-12-3-B"
  },
  "exists": true,
  "nextAction": "review_packages"
}
```

#### Success Response (200) - Package Not Found
```json
{
  "status": "success",
  "message": "Package not found in system. Add to batch?",
  "packageId": "1Z999AA10123456784",
  "package": null,
  "exists": false,
  "nextAction": "add_to_batch"
}
```

---

### 14. Scan for Receive

**POST** `/packages/scan/receive`

Scan a package specifically for receiving workflow.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "trackingNumber": "1Z999AA10123456784",
  "warehouseId": "770e8400-e29b-41d4-a716-446655440003",
  "storageLocation": "A-12-3-B"
}
```

#### Success Response (200)
```json
{
  "exists": false,
  "message": "Package not in system. Ready to receive.",
  "trackingNumber": "1Z999AA10123456784",
  "suggestedLocation": "A-12-3-B"
}
```

---

### 15. Scan for Deliver

**POST** `/packages/scan/deliver`

Scan a package specifically for delivery workflow.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "trackingNumber": "1Z999AA10123456784"
}
```

#### Success Response (200)
```json
{
  "exists": true,
  "package": {
    "id": "880e8400-e29b-41d4-a716-446655440020",
    "trackingNumber": "1Z999AA10123456784",
    "recipientName": "Jane Doe",
    "recipientPhone": "+0987654321",
    "recipientAddress": "456 Elm St, Suite 200, Los Angeles, CA 90001",
    "transactionStatus": "ready_for_pickup",
    "requiresSignature": true
  },
  "message": "Package ready for delivery"
}
```

---

## Remarks Management

### 16. Get Remark Types

**GET** `/packages/remark-types`

Get available remark types/categories.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Success Response (200)
```json
{
  "remarkTypes": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440030",
      "name": "Damage",
      "code": "damage",
      "color": "#FF4444"
    },
    {
      "id": "990e8400-e29b-41d4-a716-446655440031",
      "name": "Delay",
      "code": "delay",
      "color": "#FFA500"
    },
    {
      "id": "990e8400-e29b-41d4-a716-446655440032",
      "name": "Missing Items",
      "code": "missing_items",
      "color": "#FF6B6B"
    },
    {
      "id": "990e8400-e29b-41d4-a716-446655440033",
      "name": "Customer Request",
      "code": "customer_request",
      "color": "#4169E1"
    }
  ]
}
```

---

### 17. Create Remark

**POST** `/packages/:id/remarks`

Add a remark/note to a package.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "packageRemarksTypeId": "990e8400-e29b-41d4-a716-446655440030",
  "message": "Package arrived with damaged corner. Contents appear intact."
}
```

#### Success Response (201)
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440040",
  "packageId": "880e8400-e29b-41d4-a716-446655440020",
  "remarkType": {
    "id": "990e8400-e29b-41d4-a716-446655440030",
    "name": "Damage",
    "code": "damage"
  },
  "message": "Package arrived with damaged corner. Contents appear intact.",
  "createdBy": 1,
  "createdByName": "John Doe",
  "createdAt": "2025-12-09T14:30:00Z"
}
```

---

### 18. Get Package Remarks

**GET** `/packages/:id/remarks`

Get all remarks for a package.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Success Response (200)
```json
{
  "packageId": "880e8400-e29b-41d4-a716-446655440020",
  "remarks": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440040",
      "remarkType": {
        "name": "Damage",
        "code": "damage",
        "color": "#FF4444"
      },
      "message": "Package arrived with damaged corner. Contents appear intact.",
      "createdBy": "John Doe",
      "createdAt": "2025-12-09T14:30:00Z"
    }
  ],
  "total": 1
}
```

---

### 19. Delete Remark

**DELETE** `/packages/remarks/:remarkId`

Delete a remark (soft delete).

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Success Response (204)
```
No Content
```

---

### 20. Create Remark Type

**POST** `/packages/remark-types`

Create a new remark type (admin function).

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "name": "Weather Delay",
  "code": "weather_delay",
  "color": "#87CEEB",
  "description": "Delay due to weather conditions"
}
```

#### Success Response (201)
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440034",
  "name": "Weather Delay",
  "code": "weather_delay",
  "color": "#87CEEB",
  "description": "Delay due to weather conditions",
  "createdAt": "2025-12-09T15:00:00Z"
}
```

---

## File Management

### 21. Upload Package Image

**POST** `/packages/:id/upload/image`

Upload a single image for a package.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

#### Form Data
| Field | Type | Description | Required |
|-------|------|-------------|----------|
| file | File | Image file (JPG, PNG, GIF, WebP, PDF) | ✅ |
| description | string | File description | ❌ |

#### Success Response (200)
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "file": {
    "id": "bb0e8400-e29b-41d4-a716-446655440050",
    "packageId": "880e8400-e29b-41d4-a716-446655440020",
    "fileType": "photo",
    "url": "https://res.cloudinary.com/finaldrop/image/upload/v123456/packages/880e8400_001.jpg",
    "publicId": "packages/880e8400_001",
    "description": "Package arrival photo",
    "uploadedAt": "2025-12-09T15:15:00Z"
  }
}
```

#### Validation Rules
- **Accepted formats:** JPG, JPEG, PNG, GIF, WebP, PDF
- **Max file size:** 10MB

---

### 22. Upload Multiple Package Images

**POST** `/packages/:id/upload/images`

Upload multiple images at once (up to 10 files).

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

#### Form Data
| Field | Type | Description | Required |
|-------|------|-------------|----------|
| files | File[] | Image files (max 10) | ✅ |

#### Success Response (200)
```json
[
  {
    "success": true,
    "file": {
      "id": "bb0e8400-e29b-41d4-a716-446655440050",
      "url": "https://res.cloudinary.com/finaldrop/image/upload/v123456/packages/880e8400_001.jpg",
      "uploadedAt": "2025-12-09T15:20:00Z"
    }
  },
  {
    "success": true,
    "file": {
      "id": "bb0e8400-e29b-41d4-a716-446655440051",
      "url": "https://res.cloudinary.com/finaldrop/image/upload/v123456/packages/880e8400_002.jpg",
      "uploadedAt": "2025-12-09T15:20:00Z"
    }
  }
]
```

---

### 23. Upload Shipping Label

**POST** `/packages/:id/upload/label`

Upload a shipping label image/PDF.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

#### Form Data
| Field | Type | Description | Required |
|-------|------|-------------|----------|
| file | File | Label file | ✅ |

#### Success Response (200)
```json
{
  "success": true,
  "message": "Shipping label uploaded successfully",
  "file": {
    "id": "bb0e8400-e29b-41d4-a716-446655440052",
    "packageId": "880e8400-e29b-41d4-a716-446655440020",
    "fileType": "label",
    "url": "https://res.cloudinary.com/finaldrop/image/upload/v123456/labels/880e8400.pdf",
    "uploadedAt": "2025-12-09T15:25:00Z"
  }
}
```

---

### 24. Create File Record

**POST** `/packages/:id/files`

Create a file record (for files already uploaded elsewhere).

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "fileTitle": "Package photo - front view",
  "file": "https://example.com/files/package_123.jpg",
  "fileType": "photo"
}
```

#### Success Response (201)
```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440053",
  "packageId": "880e8400-e29b-41d4-a716-446655440020",
  "fileTitle": "Package photo - front view",
  "file": "https://example.com/files/package_123.jpg",
  "fileType": "photo",
  "createdAt": "2025-12-09T15:30:00Z"
}
```

#### File Types
- `photo` - Package photos
- `pod` - Proof of delivery
- `signature` - Signature images
- `label` - Shipping labels
- `document` - Other documents

---

### 25. Get Package Files

**GET** `/packages/:id/files`

Get all files attached to a package.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Success Response (200)
```json
{
  "packageId": "880e8400-e29b-41d4-a716-446655440020",
  "files": [
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440050",
      "fileType": "photo",
      "fileTitle": "Package arrival photo",
      "url": "https://res.cloudinary.com/finaldrop/image/upload/v123456/packages/880e8400_001.jpg",
      "uploadedBy": "John Doe",
      "uploadedAt": "2025-12-09T15:15:00Z"
    },
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440052",
      "fileType": "label",
      "fileTitle": "Shipping label",
      "url": "https://res.cloudinary.com/finaldrop/image/upload/v123456/labels/880e8400.pdf",
      "uploadedBy": "Jane Smith",
      "uploadedAt": "2025-12-09T15:25:00Z"
    }
  ],
  "total": 2
}
```

---

### 26. Get Files by Type

**GET** `/packages/:id/files/:type`

Get files of a specific type for a package.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### URL Parameters
| Parameter | Type | Values |
|-----------|------|--------|
| type | string | photo, pod, signature, label, document |

#### Example Request
```http
GET /packages/880e8400-e29b-41d4-a716-446655440020/files/photo
```

#### Success Response (200)
```json
{
  "packageId": "880e8400-e29b-41d4-a716-446655440020",
  "fileType": "photo",
  "files": [
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440050",
      "fileTitle": "Package arrival photo",
      "url": "https://res.cloudinary.com/finaldrop/image/upload/v123456/packages/880e8400_001.jpg",
      "uploadedAt": "2025-12-09T15:15:00Z"
    }
  ],
  "total": 1
}
```

---

### 27. Delete File

**DELETE** `/packages/files/:fileId`

Delete a file (soft delete).

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Success Response (204)
```
No Content
```

---

## Transfer History

### 28. Create Transfer Record

**POST** `/packages/:id/transfers`

Log a package transfer between warehouses or locations.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "fromWarehouseId": "770e8400-e29b-41d4-a716-446655440003",
  "toWarehouseId": "770e8400-e29b-41d4-a716-446655440004",
  "fromLocation": "A-12-3-B",
  "toLocation": "B-05-2-A",
  "transferType": "internal",
  "transferStatus": "completed"
}
```

#### Success Response (201)
```json
{
  "id": "cc0e8400-e29b-41d4-a716-446655440060",
  "packageId": "880e8400-e29b-41d4-a716-446655440020",
  "fromWarehouse": {
    "id": "770e8400-e29b-41d4-a716-446655440003",
    "name": "Main Warehouse"
  },
  "toWarehouse": {
    "id": "770e8400-e29b-41d4-a716-446655440004",
    "name": "Distribution Center"
  },
  "fromLocation": "A-12-3-B",
  "toLocation": "B-05-2-A",
  "transferType": "internal",
  "transferStatus": "completed",
  "createdBy": 1,
  "createdAt": "2025-12-09T16:00:00Z"
}
```

#### Transfer Types
- `internal` - Within same facility
- `external` - Between facilities
- `pickup` - Customer pickup
- `delivery` - Delivery to customer

---

### 29. Get Transfer History

**GET** `/packages/:id/transfers`

Get all transfer records for a package.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Success Response (200)
```json
{
  "packageId": "880e8400-e29b-41d4-a716-446655440020",
  "transfers": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440060",
      "fromWarehouse": "Main Warehouse",
      "toWarehouse": "Distribution Center",
      "fromLocation": "A-12-3-B",
      "toLocation": "B-05-2-A",
      "transferType": "internal",
      "transferStatus": "completed",
      "performedBy": "John Doe",
      "createdAt": "2025-12-09T16:00:00Z"
    }
  ],
  "total": 1
}
```

---

## Bulk Operations

### 30. Bulk Update Status

**POST** `/packages/bulk`

Perform bulk actions on multiple packages.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body - Update Status
```json
{
  "packageIds": [
    "880e8400-e29b-41d4-a716-446655440020",
    "880e8400-e29b-41d4-a716-446655440021",
    "880e8400-e29b-41d4-a716-446655440022"
  ],
  "action": "updateStatus",
  "newStatus": "ready_for_pickup"
}
```

#### Request Body - Bulk Delete
```json
{
  "packageIds": [
    "880e8400-e29b-41d4-a716-446655440023",
    "880e8400-e29b-41d4-a716-446655440024"
  ],
  "action": "delete"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "action": "updateStatus",
  "processed": 3,
  "failed": 0,
  "results": [
    {
      "packageId": "880e8400-e29b-41d4-a716-446655440020",
      "success": true
    },
    {
      "packageId": "880e8400-e29b-41d4-a716-446655440021",
      "success": true
    },
    {
      "packageId": "880e8400-e29b-41d4-a716-446655440022",
      "success": true
    }
  ]
}
```

---

## cURL Testing Examples

### Create Package
```bash
curl -X POST http://localhost:3000/packages \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trackingNumber": "1Z999AA10123456784",
    "transactionType": "receive",
    "recipientName": "Jane Doe",
    "carrierId": "660e8400-e29b-41d4-a716-446655440001",
    "weight": 5.5,
    "weightUnit": "lbs"
  }'
```

### Search Packages
```bash
curl -X GET "http://localhost:3000/packages/search?q=1Z999AA&organizationId=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Scan Package
```bash
curl -X POST http://localhost:3000/packages/scan \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "barcode": "1Z999AA10123456784",
    "format": "CODE_128",
    "warehouseId": "770e8400-e29b-41d4-a716-446655440003"
  }'
```

### Upload Package Image
```bash
curl -X POST http://localhost:3000/packages/880e8400-e29b-41d4-a716-446655440020/upload/image \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "description=Package arrival photo"
```

### Create Remark
```bash
curl -X POST http://localhost:3000/packages/880e8400-e29b-41d4-a716-446655440020/remarks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "packageRemarksTypeId": "990e8400-e29b-41d4-a716-446655440030",
    "message": "Package arrived with damaged corner"
  }'
```

### Bulk Update Status
```bash
curl -X POST http://localhost:3000/packages/bulk \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "packageIds": ["880e8400-e29b-41d4-a716-446655440020"],
    "action": "updateStatus",
    "newStatus": "ready_for_pickup"
  }'
```

---

## Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid input, validation error, or duplicate tracking number |
| 401 | Unauthorized - Missing or invalid JWT token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Package, file, or remark not found |
| 413 | Payload Too Large - File exceeds 10MB limit |
| 500 | Internal Server Error - Server-side error |

---

## Notes

- **File Storage:** All files are stored in Cloudinary for optimal CDN delivery
- **Soft Deletes:** Packages, files, and remarks use soft deletes (marked as deleted, not removed)
- **Tracking Numbers:** Must be unique across the system
- **Barcode Formats:** Supports QR_CODE, CODE_128, CODE_39, EAN_13
- **Storage Locations:** Format is typically "Zone-Isle-Shelf-Bin" (e.g., A-12-3-B)
- **Transaction Types:** receive, deliver, return
- **File Upload Limits:** Single image 10MB, multiple images max 10 files
- **Pagination:** Default limit is 10, max is 100

---

## Navigation

[← Previous: Organizations Module](./03_ORGANIZATIONS.md) | [Next: Transactions Module →](./05_TRANSACTIONS.md)

[Back to Index](./00_INDEX.md)
