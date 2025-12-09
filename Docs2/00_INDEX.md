# 📚 FinalDrop Backend API Documentation

## 📋 Overview
Complete API documentation for FinalDrop backend with request/response examples for easy testing.

**Base URL:** `http://localhost:3000` (Development)  
**Authentication:** JWT Bearer Token (required for most endpoints)

---

## 🗂️ Module Index

### Core Modules

| # | Module | File | Endpoints | Description |
|---|--------|------|-----------|-------------|
| 1 | **Authentication** | [`01_AUTH.md`](./01_AUTH.md) | 13 | User registration, login, social auth, password reset |
| 2 | **Users** | [`02_USERS.md`](./02_USERS.md) | 9 | User management, profiles, avatar uploads |
| 3 | **Organizations** | [`03_ORGANIZATIONS.md`](./03_ORGANIZATIONS.md) | 8 | ✅ Organization CRUD, logo uploads, switching |
| 4 | **Packages** | [`04_PACKAGES.md`](./04_PACKAGES.md) | 30 | ✅ Package management, tracking, files, remarks, scanning |
| 5 | **Transactions** | [`05_TRANSACTIONS.md`](./05_TRANSACTIONS.md) | 13 | ✅ Receive, deliver, return workflows |
| 6 | **Dashboard** | [`06_DASHBOARD.md`](./06_DASHBOARD.md) | 13 | ✅ Statistics, charts, Kanban boards, activity monitoring |
| 7 | **Warehouses** | *Coming Soon* | - | Warehouse management, storage locations |
| 8 | **Carriers** | *Coming Soon* | - | Carrier/logistics partner management |
| 9 | **Contacts** | *Coming Soon* | - | AI chatbot, customer support sessions |
| 10 | **Roles** | *Coming Soon* | - | Role-based access control |
| 11 | **Settings** | *Coming Soon* | - | Organization & user settings |
| 12 | **Devices** | *Coming Soon* | - | Device management, linking |
| 13 | **OCR** | *Coming Soon* | - | Shipping label scanning |
| 14 | **POD** | *Coming Soon* | - | Proof of delivery capture |
| 15 | **Cloudinary** | *Coming Soon* | - | File upload & management |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FinalDrop Backend System                  │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │  Auth   │          │ Package │          │Dashboard│
   │ Module  │          │ Module  │          │ Module  │
   └────┬────┘          └────┬────┘          └────┬────┘
        │                     │                     │
        │              ┌──────┴──────┐              │
        │              │             │              │
   ┌────▼────┐   ┌────▼────┐   ┌───▼─────┐   ┌───▼─────┐
   │  Users  │   │  Trans- │   │Warehouse│   │Carriers │
   │ Module  │   │ actions │   │ Module  │   │ Module  │
   └────┬────┘   └────┬────┘   └───┬─────┘   └───┬─────┘
        │              │             │              │
        └──────────────┴─────────────┴──────────────┘
                       │
              ┌────────┴────────┐
              │                 │
         ┌────▼────┐      ┌────▼────┐
         │Database │      │  Redis  │
         │(Postgres│      │ (Queue) │
         └─────────┘      └─────────┘
```

---

## 🔄 Key Workflows

### 1. **Package Receive Flow**
```
Scan Package → Receive Package → Assign Storage → Add Photos → Complete Receipt
    (OCR)      (Transactions)    (Transactions)   (Transactions)  (Transactions)
```

### 2. **Package Delivery Flow**
```
Prepare Delivery → Start Delivery → Complete/Failed Delivery
  (Transactions)   (Transactions)      (Transactions + POD)
```

### 3. **Authentication Flow**
```
Register → Email Verify → Login → Get JWT Token → Access Protected APIs
  (Auth)      (Auth)      (Auth)      (Auth)         (All Modules)
```

### 4. **Dashboard Data Flow**
```
User Login → Select Organization → Dashboard Summary → View Charts/Kanban
   (Auth)       (Auth/Org)           (Dashboard)        (Dashboard)
```

---

## 🔐 Authentication

### Getting Started

1. **Register a new account:**
   ```bash
   POST /auth/register
   ```

2. **Login to get JWT token:**
   ```bash
   POST /auth/login
   ```

3. **Use token in all requests:**
   ```bash
   Authorization: Bearer <your_jwt_token>
   ```

### Authentication Types

| Type | Endpoint | Description |
|------|----------|-------------|
| Email/Password | `POST /auth/login` | Standard authentication |
| Google OAuth | `POST /auth/google` | Google sign-in |
| Facebook OAuth | `POST /auth/facebook` | Facebook sign-in |
| Apple Sign-In | `POST /auth/apple` | Apple authentication |
| Firebase OAuth | `POST /auth/social` | Firebase authentication |

---

## 📊 Status Codes

### Package Status Values
- `Pending` - Awaiting action
- `Available` - Ready for pickup/delivery
- `In Transit` - Being transported
- `Out for Delivery` - On delivery route
- `Delivered` - Successfully delivered
- `Returned` - Returned to sender
- `Failed` - Delivery failed
- `Cancelled` - Cancelled by user

### Transaction Status Values
- `Pending` - Awaiting processing
- `InProgress` - Currently processing
- `Completed` - Successfully completed
- `Failed` - Transaction failed
- `Cancelled` - Transaction cancelled

### HTTP Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success, no body
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Auth required
- `403 Forbidden` - No permission
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 🧪 Testing Tips

### 1. **Use Environment Variables**
```bash
BASE_URL=http://localhost:3000
JWT_TOKEN=your_jwt_token_here
ORG_ID=your_organization_id
```

### 2. **Postman Collection**
Import the provided Postman collection for quick testing of all endpoints.

### 3. **Sample Test Flow**
```bash
# 1. Register
POST {{BASE_URL}}/auth/register

# 2. Login
POST {{BASE_URL}}/auth/login

# 3. Get Current User
GET {{BASE_URL}}/auth/me
Authorization: Bearer {{JWT_TOKEN}}

# 4. Create Package
POST {{BASE_URL}}/packages
Authorization: Bearer {{JWT_TOKEN}}

# 5. View Dashboard
GET {{BASE_URL}}/dashboard/summary?organizationId={{ORG_ID}}
Authorization: Bearer {{JWT_TOKEN}}
```

---

## 📝 Common Request Headers

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
Accept: application/json
```

---

## 🔗 Quick Links

- [Authentication Module](./01_AUTH.md) - Start here for API access
- [Packages Module](./04_PACKAGES.md) - Core package management
- [Dashboard Module](./06_DASHBOARD.md) - Analytics and statistics
- [Transactions Module](./05_TRANSACTIONS.md) - Receive/Deliver/Return flows

---

## 📞 Support

For questions or issues:
- Backend Team: backend@finaldrop.com
- Documentation Issues: Create a GitHub issue
- API Status: https://status.finaldrop.com

---

**Last Updated:** December 9, 2025  
**API Version:** 1.0.0  
**Documentation Version:** 1.0.0
