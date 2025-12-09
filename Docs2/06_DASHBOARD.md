# 📊 Dashboard Module API

## Overview
Dashboard analytics, statistics, performance charts, Kanban boards, and activity monitoring.

**Base Path:** `/dashboard`  
**Authentication Required:** 🔒 Yes (all endpoints)

---

## Table of Contents
- [Summary Statistics](#summary-statistics)
- [Performance Charts](#performance-charts)
- [Recent Transactions](#recent-transactions)
- [Activity Monitoring](#activity-monitoring)
- [Kanban Boards](#kanban-boards)
- [Warehouse & Carrier Stats](#warehouse--carrier-stats)

---

## Dashboard Periods

All dashboard endpoints support period filtering:

| Period | Description |
|--------|-------------|
| `today` | Current day |
| `yesterday` | Previous day |
| `last_7_days` | Last 7 days |
| `last_30_days` | Last 30 days |
| `this_week` | Current week (Monday-Sunday) |
| `this_month` | Current month |
| `last_month` | Previous month |
| `custom` | Custom date range (requires dateFrom and dateTo) |

---

## Summary Statistics

### 1. Get Dashboard Summary

**GET** `/dashboard/summary`

Get 6-card summary statistics (Received, Delivered, Transferred, Return, Pending, Cancelled).

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| period | enum | Time period | last_7_days |
| dateFrom | ISO 8601 | Start date (for custom) | - |
| dateTo | ISO 8601 | End date (for custom) | - |
| organizationId | UUID | Filter by organization | - |
| warehouseId | UUID | Filter by warehouse | - |

#### Example Request
```http
GET /dashboard/summary?period=last_7_days&organizationId=550e8400-e29b-41d4-a716-446655440000
```

#### Success Response (200)
```json
{
  "period": "last_7_days",
  "dateFrom": "2025-12-02T00:00:00Z",
  "dateTo": "2025-12-09T23:59:59Z",
  "received": {
    "count": 245,
    "changePercent": 12.5,
    "trend": "up"
  },
  "delivered": {
    "count": 198,
    "changePercent": -3.2,
    "trend": "down"
  },
  "transferred": {
    "count": 34,
    "changePercent": 8.7,
    "trend": "up"
  },
  "return": {
    "count": 12,
    "changePercent": -15.4,
    "trend": "down"
  },
  "pending": {
    "count": 67,
    "changePercent": 5.3,
    "trend": "up"
  },
  "cancelled": {
    "count": 8,
    "changePercent": 0,
    "trend": "neutral"
  }
}
```

---

### 2. Get Quick Stats

**GET** `/dashboard/quick-stats`

Get specific metric statistics quickly.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| statTypes | string[] | Array of stat types | 
| period | enum | Time period |

#### Example Request
```http
GET /dashboard/quick-stats?statTypes=received&statTypes=delivered&period=today
```

#### Success Response (200)
```json
{
  "period": "today",
  "stats": {
    "received": {
      "count": 34,
      "changePercent": 15.2,
      "trend": "up"
    },
    "delivered": {
      "count": 28,
      "changePercent": -5.1,
      "trend": "down"
    }
  }
}
```

---

### 3. Get Dashboard Stats (Legacy)

**GET** `/dashboard/stats`

Get comprehensive dashboard statistics (backward compatibility).

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Query Parameters
Same as `/dashboard/summary`

#### Success Response (200)
```json
{
  "totalPackagesReceived": 245,
  "totalPackagesDelivered": 198,
  "totalPackagesPending": 67,
  "totalPackagesReturned": 12,
  "totalPackagesTransferred": 34,
  "totalPackagesCancelled": 8,
  "receivedChangePercent": 12.5,
  "deliveredChangePercent": -3.2,
  "pendingChangePercent": 5.3,
  "returnedChangePercent": -15.4,
  "transferredChangePercent": 8.7,
  "cancelledChangePercent": 0,
  "avgProcessingTimeHours": 18.5,
  "customerSatisfactionScore": 4.7
}
```

---

## Performance Charts

### 4. Get Performance Chart

**GET** `/dashboard/performance`

Get weekly performance chart data with multiple series (line chart).

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| period | enum | Time period | last_7_days |
| dateFrom | ISO 8601 | Start date (for custom) | - |
| dateTo | ISO 8601 | End date (for custom) | - |
| organizationId | UUID | Filter by organization | - |
| warehouseId | UUID | Filter by warehouse | - |

#### Example Request
```http
GET /dashboard/performance?period=last_7_days
```

#### Success Response (200)
```json
{
  "period": "last_7_days",
  "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "datasets": [
    {
      "name": "Received",
      "color": "#4169E1",
      "data": [45, 52, 38, 47, 55, 28, 23]
    },
    {
      "name": "Delivered",
      "color": "#32CD32",
      "data": [38, 42, 35, 40, 48, 22, 18]
    },
    {
      "name": "Transferred",
      "color": "#FFA500",
      "data": [5, 8, 3, 6, 7, 3, 2]
    },
    {
      "name": "Returned",
      "color": "#FF6347",
      "data": [2, 1, 3, 1, 2, 2, 1]
    },
    {
      "name": "Pending",
      "color": "#FFD700",
      "data": [12, 15, 10, 13, 17, 8, 7]
    }
  ]
}
```

---

### 5. Get Package Chart

**GET** `/dashboard/charts/packages`

Get package statistics chart (line, bar, or pie).

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| chartType | string | line, bar, pie | line |
| period | enum | Time period | last_7_days |
| organizationId | UUID | Filter by organization | - |
| warehouseId | UUID | Filter by warehouse | - |

#### Example Request
```http
GET /dashboard/charts/packages?chartType=bar&period=this_month
```

#### Success Response (200)
```json
{
  "chartType": "bar",
  "title": "Package Volume - This Month",
  "period": "this_month",
  "data": [
    {
      "label": "Week 1",
      "value": 234,
      "date": "2025-12-01"
    },
    {
      "label": "Week 2",
      "value": 289,
      "date": "2025-12-08"
    }
  ]
}
```

---

## Recent Transactions

### 6. Get Recent Transactions

**GET** `/dashboard/transactions`

Get recent transactions table data with pagination.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| period | enum | Time period | last_7_days |
| dateFrom | ISO 8601 | Start date | - |
| dateTo | ISO 8601 | End date | - |
| organizationId | UUID | Filter by organization | - |
| warehouseId | UUID | Filter by warehouse | - |
| page | number | Page number | 1 |
| limit | number | Items per page (1-100) | 10 |
| status | string | Filter by status | - |
| search | string | Search query | - |

#### Example Request
```http
GET /dashboard/transactions?period=last_7_days&page=1&limit=20&status=delivered
```

#### Success Response (200)
```json
{
  "transactions": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440020",
      "date": "2025-12-09T16:45:00Z",
      "deliveredBy": {
        "id": "1",
        "name": "Mike Johnson",
        "avatar": "https://res.cloudinary.com/finaldrop/image/upload/v123456/avatars/mike.jpg"
      },
      "receiver": {
        "id": "2",
        "name": "Jane Doe",
        "avatar": "https://res.cloudinary.com/finaldrop/image/upload/v123456/avatars/jane.jpg"
      },
      "status": "delivered",
      "statusColor": "#32CD32",
      "invoice": "INV-2025-001234",
      "tracking": "1Z999AA10123456784"
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440021",
      "date": "2025-12-09T15:30:00Z",
      "deliveredBy": {
        "id": "1",
        "name": "Mike Johnson",
        "avatar": "https://res.cloudinary.com/finaldrop/image/upload/v123456/avatars/mike.jpg"
      },
      "receiver": {
        "id": "3",
        "name": "Bob Wilson",
        "avatar": null
      },
      "status": "out_for_delivery",
      "statusColor": "#FFA500",
      "invoice": "INV-2025-001235",
      "tracking": "1Z999AA10123456785"
    }
  ],
  "total": 198,
  "page": 1,
  "pageSize": 20,
  "hasMore": true
}
```

---

## Activity Monitoring

### 7. Get Activity Summary

**GET** `/dashboard/activity-summary`

Get activity summary counts (Dispatched, Blacklist, Linked devices, Received).

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| period | enum | Time period |
| organizationId | UUID | Filter by organization |

#### Example Request
```http
GET /dashboard/activity-summary?period=today
```

#### Success Response (200)
```json
{
  "period": "today",
  "dispatched": 45,
  "blacklist": 3,
  "linkedDevices": 28,
  "received": 52
}
```

---

### 8. Get Recent Activity

**GET** `/dashboard/activity`

Get detailed recent activity log (DASH-003).

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| period | enum | Time period | last_7_days |
| limit | number | Max results | 20 |
| organizationId | UUID | Filter by organization | - |
| warehouseId | UUID | Filter by warehouse | - |

#### Example Request
```http
GET /dashboard/activity?period=today&limit=10
```

#### Success Response (200)
```json
{
  "activities": [
    {
      "id": "act_001",
      "activityType": "package_delivered",
      "description": "Package 1Z999AA10123456784 delivered to Jane Doe",
      "entityType": "package",
      "entityId": "880e8400-e29b-41d4-a716-446655440020",
      "userId": "1",
      "userName": "Mike Johnson",
      "timestamp": "2025-12-09T16:45:00Z",
      "metadata": {
        "trackingNumber": "1Z999AA10123456784",
        "recipientName": "Jane Doe",
        "status": "delivered"
      }
    },
    {
      "id": "act_002",
      "activityType": "package_received",
      "description": "Package 1Z999AA10123456790 received at Main Warehouse",
      "entityType": "package",
      "entityId": "880e8400-e29b-41d4-a716-446655440025",
      "userId": "2",
      "userName": "John Doe",
      "timestamp": "2025-12-09T15:30:00Z",
      "metadata": {
        "trackingNumber": "1Z999AA10123456790",
        "warehouse": "Main Warehouse"
      }
    },
    {
      "id": "act_003",
      "activityType": "user_login",
      "description": "User John Doe logged in",
      "entityType": "user",
      "entityId": "2",
      "userId": "2",
      "userName": "John Doe",
      "timestamp": "2025-12-09T08:00:00Z"
    }
  ],
  "total": 156
}
```

#### Activity Types
- `package_received`
- `package_delivered`
- `package_transferred`
- `package_returned`
- `status_changed`
- `user_login`
- `user_logout`
- `settings_updated`
- `warehouse_created`

---

## Kanban Boards

### 9. Get Receive Kanban Board

**GET** `/dashboard/kanban/receive`

Get Kanban board for receive workflow (DASH-002).

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| period | enum | Time period |
| organizationId | UUID | Filter by organization |
| warehouseId | UUID | Filter by warehouse |

#### Example Request
```http
GET /dashboard/kanban/receive?organizationId=550e8400-e29b-41d4-a716-446655440000
```

#### Success Response (200)
```json
{
  "transactionType": "receive",
  "columns": [
    {
      "statusId": "status_001",
      "statusName": "Pending Receipt",
      "statusCode": "pending_receipt",
      "color": "#FFD700",
      "count": 23,
      "packages": [
        {
          "id": "880e8400-e29b-41d4-a716-446655440030",
          "trackingNumber": "1Z999AA10123456800",
          "recipientName": "Alice Brown",
          "carrierName": "UPS",
          "createdAt": "2025-12-09T14:00:00Z",
          "priority": "high"
        }
      ]
    },
    {
      "statusId": "status_002",
      "statusName": "Received",
      "statusCode": "received",
      "color": "#4169E1",
      "count": 45,
      "packages": [
        {
          "id": "880e8400-e29b-41d4-a716-446655440020",
          "trackingNumber": "1Z999AA10123456784",
          "recipientName": "Jane Doe",
          "carrierName": "UPS",
          "createdAt": "2025-12-09T10:30:00Z",
          "priority": "normal"
        }
      ]
    },
    {
      "statusId": "status_003",
      "statusName": "In Storage",
      "statusCode": "in_storage",
      "color": "#32CD32",
      "count": 156,
      "packages": []
    },
    {
      "statusId": "status_004",
      "statusName": "Ready for Pickup",
      "statusCode": "ready_for_pickup",
      "color": "#00CED1",
      "count": 34,
      "packages": []
    }
  ],
  "totalCount": 258
}
```

---

### 10. Get Deliver Kanban Board

**GET** `/dashboard/kanban/deliver`

Get Kanban board for deliver workflow.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Query Parameters
Same as Receive Kanban

#### Success Response (200)
```json
{
  "transactionType": "deliver",
  "columns": [
    {
      "statusId": "status_005",
      "statusName": "Pending Delivery",
      "statusCode": "pending_delivery",
      "color": "#FFD700",
      "count": 28,
      "packages": []
    },
    {
      "statusId": "status_006",
      "statusName": "Out for Delivery",
      "statusCode": "out_for_delivery",
      "color": "#FFA500",
      "count": 15,
      "packages": []
    },
    {
      "statusId": "status_007",
      "statusName": "Delivered",
      "statusCode": "delivered",
      "color": "#32CD32",
      "count": 198,
      "packages": []
    },
    {
      "statusId": "status_008",
      "statusName": "Delivery Failed",
      "statusCode": "delivery_failed",
      "color": "#FF6347",
      "count": 7,
      "packages": []
    }
  ],
  "totalCount": 248
}
```

---

### 11. Get Return Kanban Board

**GET** `/dashboard/kanban/return`

Get Kanban board for return workflow.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Query Parameters
Same as Receive Kanban

#### Success Response (200)
```json
{
  "transactionType": "return",
  "columns": [
    {
      "statusId": "status_009",
      "statusName": "Return Requested",
      "statusCode": "return_requested",
      "color": "#FF6B6B",
      "count": 8,
      "packages": []
    },
    {
      "statusId": "status_010",
      "statusName": "Return in Transit",
      "statusCode": "return_in_transit",
      "color": "#FFA500",
      "count": 5,
      "packages": []
    },
    {
      "statusId": "status_011",
      "statusName": "Return Received",
      "statusCode": "return_received",
      "color": "#4169E1",
      "count": 3,
      "packages": []
    },
    {
      "statusId": "status_012",
      "statusName": "Return Processed",
      "statusCode": "return_processed",
      "color": "#32CD32",
      "count": 12,
      "packages": []
    }
  ],
  "totalCount": 28
}
```

---

## Warehouse & Carrier Stats

### 12. Get Warehouse Occupancy

**GET** `/dashboard/warehouses/occupancy`

Get warehouse capacity and occupancy statistics.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| organizationId | UUID | Filter by organization |

#### Example Request
```http
GET /dashboard/warehouses/occupancy?organizationId=550e8400-e29b-41d4-a716-446655440000
```

#### Success Response (200)
```json
{
  "warehouses": [
    {
      "warehouseId": "770e8400-e29b-41d4-a716-446655440003",
      "warehouseName": "Main Warehouse",
      "totalCapacity": 5000,
      "currentOccupancy": 3456,
      "occupancyPercent": 69.12
    },
    {
      "warehouseId": "770e8400-e29b-41d4-a716-446655440004",
      "warehouseName": "Distribution Center",
      "totalCapacity": 3000,
      "currentOccupancy": 1234,
      "occupancyPercent": 41.13
    },
    {
      "warehouseId": "770e8400-e29b-41d4-a716-446655440005",
      "warehouseName": "North Facility",
      "totalCapacity": 2000,
      "currentOccupancy": 1890,
      "occupancyPercent": 94.5
    }
  ]
}
```

---

### 13. Get Top Carriers

**GET** `/dashboard/carriers/top`

Get top carriers by package volume and performance.

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| period | enum | Time period | last_30_days |
| limit | number | Max results | 10 |
| organizationId | UUID | Filter by organization | - |

#### Example Request
```http
GET /dashboard/carriers/top?period=last_30_days&limit=5
```

#### Success Response (200)
```json
{
  "carriers": [
    {
      "carrierId": "660e8400-e29b-41d4-a716-446655440001",
      "carrierName": "UPS",
      "packageCount": 1234,
      "avgDeliveryTimeHours": 18.5
    },
    {
      "carrierId": "660e8400-e29b-41d4-a716-446655440002",
      "carrierName": "FedEx",
      "packageCount": 987,
      "avgDeliveryTimeHours": 20.3
    },
    {
      "carrierId": "660e8400-e29b-41d4-a716-446655440003",
      "carrierName": "DHL",
      "packageCount": 654,
      "avgDeliveryTimeHours": 22.1
    },
    {
      "carrierId": "660e8400-e29b-41d4-a716-446655440004",
      "carrierName": "USPS",
      "packageCount": 543,
      "avgDeliveryTimeHours": 48.7
    },
    {
      "carrierId": "660e8400-e29b-41d4-a716-446655440005",
      "carrierName": "Local Courier",
      "packageCount": 321,
      "avgDeliveryTimeHours": 12.3
    }
  ],
  "period": "last_30_days"
}
```

---

## cURL Testing Examples

### Get Summary Statistics
```bash
curl -X GET "http://localhost:3000/dashboard/summary?period=last_7_days" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Performance Chart
```bash
curl -X GET "http://localhost:3000/dashboard/performance?period=this_month" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Recent Transactions
```bash
curl -X GET "http://localhost:3000/dashboard/transactions?page=1&limit=20&status=delivered" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Activity Summary
```bash
curl -X GET "http://localhost:3000/dashboard/activity-summary?period=today" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Receive Kanban Board
```bash
curl -X GET "http://localhost:3000/dashboard/kanban/receive?organizationId=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Deliver Kanban Board
```bash
curl -X GET "http://localhost:3000/dashboard/kanban/deliver" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Return Kanban Board
```bash
curl -X GET "http://localhost:3000/dashboard/kanban/return" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Recent Activity
```bash
curl -X GET "http://localhost:3000/dashboard/activity?period=today&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Warehouse Occupancy
```bash
curl -X GET "http://localhost:3000/dashboard/warehouses/occupancy?organizationId=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Top Carriers
```bash
curl -X GET "http://localhost:3000/dashboard/carriers/top?period=last_30_days&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Package Chart
```bash
curl -X GET "http://localhost:3000/dashboard/charts/packages?chartType=bar&period=this_month" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Quick Stats
```bash
curl -X GET "http://localhost:3000/dashboard/quick-stats?statTypes=received&statTypes=delivered&period=today" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Custom Date Range
```bash
curl -X GET "http://localhost:3000/dashboard/summary?period=custom&dateFrom=2025-12-01T00:00:00Z&dateTo=2025-12-09T23:59:59Z" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Dashboard Design Specifications

### 6-Card Summary Layout
The summary endpoint provides data for the main dashboard cards:
1. **Received** (Blue) - Packages received
2. **Delivered** (Green) - Packages delivered
3. **Transferred** (Orange) - Packages transferred between warehouses
4. **Return** (Red) - Returned packages
5. **Pending** (Yellow) - Pending packages
6. **Cancelled** (Gray) - Cancelled packages

Each card shows:
- Count
- Percentage change compared to previous period
- Trend indicator (up/down/neutral)

### Performance Chart
- **Type:** Line chart
- **X-axis:** Day labels (Mon-Sun for weekly view)
- **Y-axis:** Package count
- **Series:** 5 lines (Received, Delivered, Transferred, Returned, Pending)
- **Colors:** As defined in datasets

### Recent Transactions Table
Columns:
- Date
- Delivered By (with avatar)
- Receiver (with avatar)
- Status (with color badge)
- Invoice #
- Tracking #

### Kanban Boards
- **3 Types:** Receive, Deliver, Return
- **Columns:** Based on transaction status
- **Cards:** Package items with tracking, recipient, carrier
- **Drag & Drop:** Frontend implementation recommended

---

## Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid period or date range |
| 401 | Unauthorized - Missing or invalid access token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Organization or warehouse not found |
| 500 | Internal Server Error - Server-side error |

---

## Notes

- **Real-time Updates:** Consider implementing WebSocket for real-time dashboard updates
- **Caching:** Dashboard stats can be cached for improved performance (5-15 minute TTL)
- **Date Ranges:** All timestamps are in ISO 8601 format (UTC)
- **Pagination:** Transactions endpoint supports pagination, max 100 items per page
- **Color Codes:** Consistent color scheme across all dashboard elements
- **Performance:** Large datasets may require data aggregation and optimization
- **Filters:** Organization and warehouse filters available on all endpoints
- **Trend Calculation:** Change percentage calculated against previous equivalent period

---

## Performance Optimization Tips

1. **Use appropriate time periods:** Shorter periods (today, last_7_days) load faster
2. **Implement caching:** Cache dashboard data for 5-15 minutes
3. **Limit data:** Use pagination and limit parameters
4. **Filter early:** Apply organization/warehouse filters at API level
5. **Aggregate data:** Use aggregated views for large datasets
6. **Load progressively:** Load summary first, then details
7. **Use websockets:** For real-time updates instead of polling

---

## Navigation

[← Previous: Transactions Module](./05_TRANSACTIONS.md) | [Next: Index →](./00_INDEX.md)

[Back to Index](./00_INDEX.md)
