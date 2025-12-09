# 🔄 Transactions Module API

## Overview
Transaction workflows for package receiving, delivery, and returns with comprehensive status management.

**Base Path:** `/transactions`  
**Authentication Required:** 🔒 Yes (all endpoints)

---

## Table of Contents
- [Receive Flow](#receive-flow)
- [Deliver Flow](#deliver-flow)
- [Return Flow](#return-flow)
- [Common Operations](#common-operations)

---

## Transaction Types & Status Flow

### Transaction Types
- **receive** - Package receiving workflow
- **deliver** - Package delivery workflow
- **return** - Package return workflow

### Transaction Status Values

#### Receive Statuses
- `pending_receipt` - Package expected but not yet received
- `received` - Package has been received
- `in_storage` - Package stored in warehouse
- `ready_for_pickup` - Package ready for customer pickup

#### Deliver Statuses
- `pending_delivery` - Scheduled for delivery
- `out_for_delivery` - Driver has package
- `delivered` - Successfully delivered
- `delivery_failed` - Delivery attempt failed

#### Return Statuses
- `return_requested` - Return initiated by customer
- `return_in_transit` - Package being returned
- `return_received` - Return arrived at facility
- `return_processed` - Return completed

#### Common Statuses
- `cancelled` - Transaction cancelled
- `on_hold` - Temporarily paused

---

## Receive Flow

### 1. Receive Package (AGNT-001)

**POST** `/transactions/receive`

Initial step: Register a new package as received.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "trackingNumber": "1Z999AA10123456784",
  "carrierId": "660e8400-e29b-41d4-a716-446655440001",
  "carrierName": "UPS",
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "senderName": "John Smith",
  "senderPhone": "+1234567890",
  "recipientName": "Jane Doe",
  "recipientPhone": "+0987654321",
  "numberOfPackages": 1,
  "weight": 5.5,
  "weightUnit": "lbs",
  "dimensions": "12x10x8",
  "contentDescription": "Electronic devices",
  "specialInstructions": "Handle with care",
  "requiresSignature": true,
  "isFragile": true,
  "isHazardous": false,
  "declaredValue": 299.99,
  "warehouseId": "770e8400-e29b-41d4-a716-446655440003",
  "storageLocation": "A-12-3-B"
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Package received successfully",
  "package": {
    "id": "880e8400-e29b-41d4-a716-446655440020",
    "trackingNumber": "1Z999AA10123456784",
    "transactionType": "receive",
    "transactionStatus": "received",
    "recipientName": "Jane Doe",
    "weight": 5.5,
    "weightUnit": "lbs",
    "storageLocation": "A-12-3-B",
    "requiresSignature": true,
    "isFragile": true,
    "createdAt": "2025-12-09T10:30:00Z",
    "createdBy": 1
  },
  "nextSteps": [
    "assign_storage",
    "add_photos",
    "complete_receipt"
  ]
}
```

#### Error Response (400)
```json
{
  "statusCode": 400,
  "message": "Package with this tracking number already exists",
  "error": "Bad Request"
}
```

#### Validation Rules
- `trackingNumber`: Required, max 100 characters, must be unique
- `weight`: Optional number
- `weightUnit`: Optional string (lbs, kg)
- `dimensions`: Optional string format "LxWxH"

---

### 2. Assign Storage Location (AGNT-002)

**POST** `/transactions/receive/assign-storage`

Assign warehouse storage location to received package.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "packageId": "880e8400-e29b-41d4-a716-446655440020",
  "warehouseId": "770e8400-e29b-41d4-a716-446655440003",
  "storageLocation": "A-12-3-B",
  "notes": "Placed on top shelf due to fragile contents"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Storage location assigned"
}
```

#### Error Response (404)
```json
{
  "statusCode": 404,
  "message": "Package not found",
  "error": "Not Found"
}
```

---

### 3. Add Package Photo

**POST** `/transactions/packages/:id/photos`

Add photo documentation during receiving process.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "photoData": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "photoType": "arrival"
}
```

#### Success Response (201)
```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440050",
  "packageId": "880e8400-e29b-41d4-a716-446655440020",
  "photoType": "arrival",
  "url": "https://res.cloudinary.com/finaldrop/image/upload/v123456/packages/880e8400_arrival.jpg",
  "uploadedBy": "John Doe",
  "uploadedAt": "2025-12-09T11:00:00Z"
}
```

#### Photo Types
- `arrival` - Package arrival condition
- `condition` - Damage or condition documentation
- `label` - Shipping label photo
- `contents` - Package contents

---

### 4. Complete Receipt

**POST** `/transactions/receive/complete`

Finalize the receiving process.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "packageId": "880e8400-e29b-41d4-a716-446655440020",
  "agentSignature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "notes": "Package received in good condition, all items accounted for",
  "notifyRecipient": true
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Receipt completed"
}
```

---

## Deliver Flow

### 5. Prepare Delivery (AGNT-003)

**POST** `/transactions/deliver/prepare`

Prepare package for delivery.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "packageId": "880e8400-e29b-41d4-a716-446655440020",
  "deliveryAddress": "456 Elm St, Suite 200, Los Angeles, CA 90001",
  "recipientName": "Jane Doe",
  "recipientPhone": "+0987654321",
  "scheduledDeliveryDate": "2025-12-15T14:00:00Z",
  "deliveryTimeWindow": "2PM-5PM",
  "deliveryInstructions": "Call upon arrival, deliver to front desk"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Package prepared for delivery"
}
```

---

### 6. Start Delivery

**POST** `/transactions/deliver/start`

Mark packages as out for delivery.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "packageIds": [
    "880e8400-e29b-41d4-a716-446655440020",
    "880e8400-e29b-41d4-a716-446655440021"
  ],
  "driverName": "Mike Johnson",
  "vehicleInfo": "White Van - ABC-1234"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Delivery started",
  "packagesCount": 2,
  "packages": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440020",
      "trackingNumber": "1Z999AA10123456784",
      "transactionStatus": "out_for_delivery",
      "recipientName": "Jane Doe"
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440021",
      "trackingNumber": "1Z999AA10123456785",
      "transactionStatus": "out_for_delivery",
      "recipientName": "Bob Wilson"
    }
  ],
  "driver": {
    "name": "Mike Johnson",
    "vehicle": "White Van - ABC-1234"
  },
  "startedAt": "2025-12-09T08:00:00Z"
}
```

---

### 7. Complete Delivery (AGNT-004)

**POST** `/transactions/deliver/complete`

Complete delivery with proof of delivery (POD).

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "packageId": "880e8400-e29b-41d4-a716-446655440020",
  "recipientSignature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "receivedByName": "Jane Doe",
  "proofOfDeliveryPhoto": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "deliveryLocation": "Front desk",
  "notes": "Package delivered to receptionist as requested",
  "notifySender": true
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Delivery completed"
}
```

---

### 8. Delivery Failed

**POST** `/transactions/deliver/failed`

Record failed delivery attempt.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "packageId": "880e8400-e29b-41d4-a716-446655440020",
  "failureReason": "Recipient not available",
  "photo": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "notes": "Left notice card with contact information",
  "reschedule": true,
  "rescheduledDate": "2025-12-10T14:00:00Z"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Delivery failure recorded"
}
```

#### Common Failure Reasons
- "Recipient not available"
- "Address not found"
- "Business closed"
- "Access denied"
- "Weather conditions"
- "Vehicle breakdown"

---

## Return Flow

### 9. Initiate Return (AGNT-005)

**POST** `/transactions/return/initiate`

Start the return process.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "packageId": "880e8400-e29b-41d4-a716-446655440020",
  "returnReason": "Customer requested return - wrong item",
  "returnAddress": "123 Return Center Rd, Warehouse District, CA 90002",
  "returnCarrierId": "660e8400-e29b-41d4-a716-446655440002",
  "returnTrackingNumber": "1Z999AA10987654321",
  "notes": "Customer reported receiving wrong model",
  "requiresPickup": true
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Return initiated"
}
```

#### Common Return Reasons
- "Wrong item shipped"
- "Damaged during shipping"
- "Customer no longer needs item"
- "Item does not match description"
- "Defective product"
- "Refused by recipient"

---

### 10. Process Return

**POST** `/transactions/return/process`

Process received return package.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "packageId": "880e8400-e29b-41d4-a716-446655440020",
  "condition": "Good",
  "conditionNotes": "Package unopened, original packaging intact",
  "photo": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "refundApproved": true
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Return processed"
}
```

#### Condition Values
- `Good` - Package in good condition
- `Damaged` - Package damaged
- `Opened` - Package opened but contents intact

---

## Common Operations

### 11. Update Package Status

**PUT** `/transactions/packages/:id/status`

Manually update transaction status.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "newStatus": "in_storage",
  "notes": "Package moved to long-term storage",
  "notifyCustomer": false
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Status updated"
}
```

---

### 12. Bulk Status Update

**PUT** `/transactions/packages/bulk-status`

Update status for multiple packages at once.

#### Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "packageIds": [
    "880e8400-e29b-41d4-a716-446655440020",
    "880e8400-e29b-41d4-a716-446655440021",
    "880e8400-e29b-41d4-a716-446655440022"
  ],
  "newStatus": "ready_for_pickup",
  "notes": "All packages inspected and approved for pickup"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Bulk status update completed",
  "updated": 3,
  "failed": 0,
  "results": [
    {
      "packageId": "880e8400-e29b-41d4-a716-446655440020",
      "success": true,
      "previousStatus": "in_storage",
      "newStatus": "ready_for_pickup"
    },
    {
      "packageId": "880e8400-e29b-41d4-a716-446655440021",
      "success": true,
      "previousStatus": "in_storage",
      "newStatus": "ready_for_pickup"
    },
    {
      "packageId": "880e8400-e29b-41d4-a716-446655440022",
      "success": true,
      "previousStatus": "in_storage",
      "newStatus": "ready_for_pickup"
    }
  ]
}
```

---

### 13. Get Package Details with Timeline

**GET** `/transactions/packages/:id`

Get comprehensive package information including transaction timeline.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Success Response (200)
```json
{
  "package": {
    "id": "880e8400-e29b-41d4-a716-446655440020",
    "trackingNumber": "1Z999AA10123456784",
    "transactionType": "receive",
    "transactionStatus": "delivered",
    "carrier": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "UPS"
    },
    "organization": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Acme Logistics"
    },
    "warehouse": {
      "id": "770e8400-e29b-41d4-a716-446655440003",
      "name": "Main Warehouse",
      "location": "123 Industrial Blvd"
    },
    "senderName": "John Smith",
    "recipientName": "Jane Doe",
    "weight": 5.5,
    "dimensions": "12x10x8",
    "declaredValue": 299.99,
    "createdAt": "2025-12-09T10:30:00Z",
    "updatedAt": "2025-12-09T16:45:00Z"
  },
  "timeline": [
    {
      "id": "t1",
      "action": "Package Received",
      "status": "received",
      "description": "Package received at warehouse",
      "location": "Main Warehouse",
      "performedBy": "John Doe",
      "timestamp": "2025-12-09T10:30:00Z",
      "metadata": {
        "weight": 5.5,
        "condition": "good"
      }
    },
    {
      "id": "t2",
      "action": "Storage Assigned",
      "status": "in_storage",
      "description": "Assigned to storage location A-12-3-B",
      "location": "A-12-3-B",
      "performedBy": "Jane Smith",
      "timestamp": "2025-12-09T11:00:00Z"
    },
    {
      "id": "t3",
      "action": "Ready for Pickup",
      "status": "ready_for_pickup",
      "description": "Package prepared for delivery",
      "performedBy": "Mike Johnson",
      "timestamp": "2025-12-09T14:00:00Z"
    },
    {
      "id": "t4",
      "action": "Out for Delivery",
      "status": "out_for_delivery",
      "description": "Package loaded for delivery",
      "performedBy": "Driver - Mike Johnson",
      "timestamp": "2025-12-09T15:30:00Z",
      "metadata": {
        "vehicle": "White Van - ABC-1234"
      }
    },
    {
      "id": "t5",
      "action": "Delivered",
      "status": "delivered",
      "description": "Package delivered successfully",
      "location": "Front desk",
      "performedBy": "Mike Johnson",
      "timestamp": "2025-12-09T16:45:00Z",
      "metadata": {
        "receivedBy": "Jane Doe",
        "signatureUrl": "https://..."
      }
    }
  ],
  "photos": [
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440050",
      "url": "https://res.cloudinary.com/finaldrop/image/upload/v123456/packages/880e8400_arrival.jpg",
      "type": "arrival",
      "uploadedAt": "2025-12-09T11:00:00Z"
    },
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440051",
      "url": "https://res.cloudinary.com/finaldrop/image/upload/v123456/packages/880e8400_pod.jpg",
      "type": "pod",
      "uploadedAt": "2025-12-09T16:45:00Z"
    }
  ],
  "remarks": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440040",
      "message": "Customer requested front desk delivery",
      "createdBy": "Jane Smith",
      "createdAt": "2025-12-09T14:30:00Z"
    }
  ]
}
```

---

## cURL Testing Examples

### Receive Package
```bash
curl -X POST http://localhost:3000/transactions/receive \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trackingNumber": "1Z999AA10123456784",
    "carrierId": "660e8400-e29b-41d4-a716-446655440001",
    "recipientName": "Jane Doe",
    "weight": 5.5,
    "weightUnit": "lbs",
    "warehouseId": "770e8400-e29b-41d4-a716-446655440003"
  }'
```

### Assign Storage
```bash
curl -X POST http://localhost:3000/transactions/receive/assign-storage \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "880e8400-e29b-41d4-a716-446655440020",
    "warehouseId": "770e8400-e29b-41d4-a716-446655440003",
    "storageLocation": "A-12-3-B"
  }'
```

### Complete Receipt
```bash
curl -X POST http://localhost:3000/transactions/receive/complete \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "880e8400-e29b-41d4-a716-446655440020",
    "notes": "Received in good condition",
    "notifyRecipient": true
  }'
```

### Start Delivery
```bash
curl -X POST http://localhost:3000/transactions/deliver/start \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "packageIds": ["880e8400-e29b-41d4-a716-446655440020"],
    "driverName": "Mike Johnson",
    "vehicleInfo": "White Van - ABC-1234"
  }'
```

### Complete Delivery
```bash
curl -X POST http://localhost:3000/transactions/deliver/complete \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "880e8400-e29b-41d4-a716-446655440020",
    "receivedByName": "Jane Doe",
    "deliveryLocation": "Front desk",
    "notes": "Delivered successfully"
  }'
```

### Initiate Return
```bash
curl -X POST http://localhost:3000/transactions/return/initiate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "880e8400-e29b-41d4-a716-446655440020",
    "returnReason": "Customer requested return",
    "requiresPickup": true
  }'
```

### Bulk Status Update
```bash
curl -X PUT http://localhost:3000/transactions/packages/bulk-status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "packageIds": ["880e8400-e29b-41d4-a716-446655440020"],
    "newStatus": "ready_for_pickup"
  }'
```

### Get Package Details
```bash
curl -X GET http://localhost:3000/transactions/packages/880e8400-e29b-41d4-a716-446655440020 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Workflow Diagrams

### Receive Workflow
```
1. POST /transactions/receive
   ↓
2. POST /transactions/receive/assign-storage
   ↓
3. POST /transactions/packages/:id/photos (optional, can be multiple)
   ↓
4. POST /transactions/receive/complete
```

### Deliver Workflow
```
1. POST /transactions/deliver/prepare
   ↓
2. POST /transactions/deliver/start
   ↓
3a. POST /transactions/deliver/complete (success)
    OR
3b. POST /transactions/deliver/failed (failure)
```

### Return Workflow
```
1. POST /transactions/return/initiate
   ↓
2. (Package in transit - tracked externally)
   ↓
3. POST /transactions/return/process
```

---

## Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid input or validation error |
| 401 | Unauthorized - Missing or invalid access token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Package not found |
| 409 | Conflict - Package status conflict or duplicate tracking number |
| 500 | Internal Server Error - Server-side error |

---

## Notes

- **Transaction Flows:** Follow the workflow order for proper status progression
- **Status Transitions:** Some status changes may be restricted based on current status
- **Notifications:** Set `notifyRecipient` or `notifySender` to trigger email/SMS notifications
- **Signatures:** Signature data should be Base64 encoded PNG images
- **Photos:** Photo data should be Base64 encoded or URL references
- **Bulk Operations:** Maximum 100 packages per bulk request
- **Timeline:** Automatically generated for all status changes and actions
- **Audit Trail:** All actions are logged with user ID and timestamp

---

## Navigation

[← Previous: Packages Module](./04_PACKAGES.md) | [Next: Dashboard Module →](./06_DASHBOARD.md)

[Back to Index](./00_INDEX.md)
