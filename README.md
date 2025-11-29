# 📦 FinalDrop Backend

<div align="center">

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

**A comprehensive package management and logistics platform built with NestJS**

[Features](#-features) • [Getting Started](#-getting-started) • [API Reference](#-api-reference) • [Architecture](#-architecture)

</div>

---

## 🚀 Features

- **🔐 Authentication & Authorization** - JWT-based auth with refresh tokens, RBAC guards
- **🏢 Multi-Tenancy** - Full organization/company switching support
- **📦 Package Management** - Complete CRUD with tracking, transfers, and status management
- **🚚 Transaction Workflows** - Receive, Deliver, and Return flow management
- **📊 Dashboard Analytics** - Real-time stats, charts, and Kanban boards
- **🤖 AI Chatbot** - Customer support with intelligent query handling
- **📷 OCR Integration** - Shipping label scanning and carrier detection
- **✍️ Proof of Delivery** - Signature capture, photos, and GPS location
- **⚡ Async Queue Processing** - BullMQ-based job handling for scalability
- **🔔 Real-time Events** - WebSocket support for live updates

---

## 📋 Tech Stack

| Component | Technology |
|-----------|------------|
| **Framework** | NestJS 10.x |
| **Language** | TypeScript 5.x |
| **Database** | PostgreSQL 15 |
| **ORM** | Drizzle ORM |
| **Cache/Queue** | Redis 7 + BullMQ |
| **Auth** | Passport.js + JWT |
| **Validation** | class-validator + class-transformer |
| **WebSockets** | Socket.IO |
| **Containerization** | Docker + Docker Compose |

---

## 🏗️ Architecture

```
src/
├── auth/           # Authentication & JWT management
├── users/          # User management
├── organizations/  # Multi-tenant organization management
├── roles/          # Role definitions
├── rbac/           # Role-based access control & permissions
├── packages/       # Core package/shipment management
├── transactions/   # Receive/Deliver/Return workflows
├── dashboard/      # Analytics & statistics
├── warehouses/     # Warehouse & storage management
├── carriers/       # Carrier/logistics partner management
├── contacts/       # AI Chatbot & customer support
├── settings/       # Organization/user settings
├── ocr/            # Shipping label OCR scanning
├── pod/            # Proof of Delivery capture
├── queue/          # Async job processing
├── events/         # WebSocket gateway
├── devices/        # Device management
├── receives/       # Package receiving operations
├── db/             # Database schema (Drizzle)
├── drizzle/        # Drizzle ORM configuration
└── common/         # Shared guards, decorators, pipes
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/junaidrao47/Finaldropbackend.git
cd finaldrop-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run migration:run

# Seed initial data
npm run seed

# Start development server
npm run start:dev
```

### Docker Setup

```bash
# Start all services (PostgreSQL, Redis, App)
docker-compose up --build

# Run in detached mode
docker-compose up -d
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/finaldrop

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# Application
PORT=3000
NODE_ENV=development
```

---

## 📚 API Reference

All endpoints require authentication unless marked as 🔓 Public.

### 🔐 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| 🔓 POST | `/auth/register` | Register a new user |
| 🔓 POST | `/auth/login` | Login with email/password |
| POST | `/auth/logout` | Logout and invalidate token |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/switch-organization` | Switch active organization |

**Login Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Login Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "organizationId": "uuid"
  }
}
```

---

### 👥 Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users (paginated) |
| GET | `/users/me` | Get current authenticated user |
| GET | `/users/:id` | Get user by ID |
| GET | `/users/:id/organizations` | Get user's organizations |
| POST | `/users` | Create new user |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |

---

### 🏢 Organizations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/organizations` | List all organizations |
| GET | `/organizations/:id` | Get organization by ID |
| POST | `/organizations` | Create new organization |
| PUT | `/organizations/:id` | Update organization |
| DELETE | `/organizations/:id` | Delete organization |
| POST | `/organizations/:id/switch` | Switch to organization |

---

### 📦 Packages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/packages` | List packages (with filters) |
| GET | `/packages/:id` | Get package by ID |
| GET | `/packages/search` | Search packages |
| GET | `/packages/stats/:organizationId` | Get package statistics |
| GET | `/packages/recent/:organizationId` | Get recent packages |
| GET | `/packages/remark-types` | Get available remark types |
| POST | `/packages` | Create new package |
| PUT | `/packages/:id` | Update package |
| PUT | `/packages/:id/status` | Update package status |
| PUT | `/packages/:id/location` | Update storage location |
| DELETE | `/packages/:id` | Soft delete package |
| POST | `/packages/:id/restore` | Restore deleted package |
| POST | `/packages/bulk` | Bulk package actions |

**Package Remarks:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/packages/:id/remarks` | Get package remarks |
| POST | `/packages/:id/remarks` | Add remark to package |
| DELETE | `/packages/remarks/:remarkId` | Delete remark |

**Package Files:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/packages/:id/files` | Get package files |
| GET | `/packages/:id/files/:type` | Get files by type |
| POST | `/packages/:id/files` | Upload file |
| DELETE | `/packages/files/:fileId` | Delete file |

**Package Transfers:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/packages/:id/transfers` | Get transfer history |
| POST | `/packages/:id/transfers` | Create transfer record |

**Package Scanning:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/packages/scan/receive` | Scan for receiving |
| POST | `/packages/scan/deliver` | Scan for delivery |

**Filter Parameters:**
```
?organizationId=uuid
&warehouseId=uuid
&transactionStatus=Pending|Received|Delivered
&search=tracking123
&dateFrom=2024-01-01
&dateTo=2024-12-31
&page=1
&limit=20
&sortBy=createdAt
&sortOrder=desc
```

---

### 🔄 Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/transactions` | List all transactions |
| GET | `/transactions/:id` | Get transaction by ID |
| GET | `/transactions/stats` | Get transaction statistics |
| POST | `/transactions/receive` | Create receive transaction |
| POST | `/transactions/deliver` | Create deliver transaction |
| POST | `/transactions/return` | Create return transaction |
| PUT | `/transactions/:id/status` | Update transaction status |
| POST | `/transactions/:id/complete` | Complete transaction |
| POST | `/transactions/:id/cancel` | Cancel transaction |

**Receive Transaction:**
```json
{
  "trackingNumber": "1Z999AA10123456784",
  "organizationId": "uuid",
  "warehouseId": "uuid",
  "senderName": "John Doe",
  "recipientName": "Jane Smith",
  "carrierId": "uuid"
}
```

---

### 📊 Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/stats` | Get dashboard statistics |
| GET | `/dashboard/kanban/receive` | Receive Kanban board |
| GET | `/dashboard/kanban/deliver` | Deliver Kanban board |
| GET | `/dashboard/kanban/return` | Return Kanban board |
| GET | `/dashboard/activity` | Recent activity feed |
| GET | `/dashboard/charts/packages` | Package chart data |
| GET | `/dashboard/warehouses/occupancy` | Warehouse occupancy |
| GET | `/dashboard/carriers/top` | Top carriers |
| GET | `/dashboard/quick-stats` | Quick statistics |

**Filter Parameters:**
```
?period=today|week|month|year
&organizationId=uuid
&warehouseId=uuid
```

---

### 🏭 Warehouses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/warehouses` | List all warehouses |
| GET | `/warehouses/:id` | Get warehouse by ID |
| GET | `/warehouses/active/:organizationId` | Get active warehouses |
| GET | `/warehouses/stats/:organizationId` | Get warehouse stats |
| POST | `/warehouses` | Create warehouse |
| PUT | `/warehouses/:id` | Update warehouse |
| DELETE | `/warehouses/:id` | Delete warehouse |
| POST | `/warehouses/:id/restore` | Restore warehouse |
| POST | `/warehouses/:id/lock` | Lock warehouse |
| POST | `/warehouses/:id/unlock` | Unlock warehouse |
| POST | `/warehouses/:id/activate` | Activate warehouse |
| POST | `/warehouses/:id/deactivate` | Deactivate warehouse |

**Default Options:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/warehouses/:id/default-options` | Get default options |
| POST | `/warehouses/:id/default-options` | Create default options |
| PUT | `/warehouses/:id/default-options` | Update default options |

**Storage Layouts:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/warehouses/:id/storage-layouts` | Get storage layouts |
| GET | `/warehouses/:id/storage-layouts/stats` | Get layout stats |
| POST | `/warehouses/:id/storage-layouts` | Create storage layout |
| PUT | `/warehouses/storage-layouts/:layoutId` | Update layout |
| DELETE | `/warehouses/storage-layouts/:layoutId` | Delete layout |

---

### 🚚 Carriers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/carriers` | List all carriers |
| GET | `/carriers/:id` | Get carrier by ID |
| GET | `/carriers/active/:organizationId` | Get active carriers |
| GET | `/carriers/stats/:organizationId` | Get carrier stats |
| POST | `/carriers` | Create carrier |
| PUT | `/carriers/:id` | Update carrier |
| DELETE | `/carriers/:id` | Delete carrier |
| POST | `/carriers/:id/restore` | Restore carrier |
| POST | `/carriers/:id/activate` | Activate carrier |
| POST | `/carriers/:id/deactivate` | Deactivate carrier |

---

### 🤖 Contacts / AI Chatbot

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/contacts/sessions` | List support sessions |
| GET | `/contacts/sessions/:id` | Get session by ID |
| GET | `/contacts/sessions/:id/messages` | Get session messages |
| POST | `/contacts/sessions` | Create support session |
| POST | `/contacts/sessions/:id/messages` | Send message |
| PUT | `/contacts/sessions/:id` | Update session |
| POST | `/contacts/sessions/:id/close` | Close session |
| POST | `/contacts/sessions/:id/escalate` | Escalate to agent |
| POST | `/contacts/ai/query` | AI query processing |
| GET | `/contacts/stats/:organizationId` | Support statistics |

**AI Query:**
```json
{
  "query": "Where is my package?",
  "sessionId": "uuid",
  "context": {
    "trackingNumber": "1Z999AA10123456784"
  }
}
```

---

### ⚙️ Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings/organization/:organizationId` | Get org settings |
| PUT | `/settings/organization/:organizationId` | Update org settings |
| GET | `/settings/warehouse/:warehouseId` | Get warehouse settings |
| PUT | `/settings/warehouse/:warehouseId` | Update warehouse settings |
| GET | `/settings/user/:userId` | Get user settings |
| PUT | `/settings/user/:userId` | Update user settings |
| GET | `/settings/notifications/:userId` | Get notification prefs |
| PUT | `/settings/notifications/:userId` | Update notification prefs |
| GET | `/settings/theme/:userId` | Get theme settings |
| PUT | `/settings/theme/:userId` | Update theme settings |

---

### 📷 OCR (Optical Character Recognition)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ocr/scan-label` | Scan shipping label image |
| POST | `/ocr/lookup-barcode` | Look up barcode |
| GET | `/ocr/detect-carrier/:trackingNumber` | Detect carrier |
| GET | `/ocr/validate/:trackingNumber` | Validate tracking number |
| GET | `/ocr/carrier-format/:carrier` | Get carrier format info |
| POST | `/ocr/batch-lookup` | Batch barcode lookup |

**Supported Carriers:**
- UPS (1Z...)
- FedEx (12/15/20 digits)
- USPS (20-22 digits)
- DHL (10-11 digits)
- Amazon (TBA...)
- OnTrac (C/D...)
- LaserShip (L...)

---

### ✍️ POD (Proof of Delivery)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/pod` | Create POD record |
| GET | `/pod` | List all PODs |
| GET | `/pod/package/:packageId` | Get POD for package |
| GET | `/pod/package/:packageId/files` | Get POD files |
| GET | `/pod/stats/:organizationId` | Get POD statistics |
| POST | `/pod/package/:packageId/photo` | Add photo to POD |
| POST | `/pod/:remarkId/verify` | Verify POD |
| DELETE | `/pod/files/:fileId` | Delete POD file |

**Create POD:**
```json
{
  "packageId": "uuid",
  "organizationId": "uuid",
  "deliveryType": "direct|left_at_door|neighbor|mailroom",
  "signature": {
    "signatureBase64": "base64...",
    "signerName": "John Doe",
    "signerRelationship": "Recipient"
  },
  "photos": [{
    "photoBase64": "base64...",
    "photoType": "delivery",
    "description": "Front door delivery"
  }],
  "location": {
    "latitude": "40.7128",
    "longitude": "-74.0060",
    "address": "123 Main St, NYC"
  },
  "recipientName": "Jane Smith",
  "isContactless": true
}
```

---

### ⚡ Queue Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/queue/stats` | Get all queue stats |
| GET | `/queue/stats/:queueName` | Get specific queue stats |
| GET | `/queue/names` | Get available queues |
| GET | `/queue/:queueName/jobs/:jobId` | Get job details |
| POST | `/queue/:queueName/jobs/:jobId/retry` | Retry failed job |
| POST | `/queue/receive` | Queue receive job |
| POST | `/queue/deliver` | Queue deliver job |
| POST | `/queue/return` | Queue return job |
| POST | `/queue/bulk-status` | Queue bulk update |
| POST | `/queue/ocr-scan` | Queue OCR scan |
| POST | `/queue/report/daily` | Queue daily report |
| POST | `/queue/export` | Queue data export |
| POST | `/queue/email` | Queue email |

**Available Queues:**
- `package-processing` - Package transaction processing
- `notifications` - Push/email notifications
- `ocr-scanning` - OCR label scanning
- `file-uploads` - Cloud storage uploads
- `reports` - Report generation
- `email` - Email sending

---

### 👮 Roles & Permissions (RBAC)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/roles` | List all roles |
| GET | `/roles/:id` | Get role by ID |
| POST | `/roles` | Create role |
| PUT | `/roles/:id` | Update role |
| DELETE | `/roles/:id` | Delete role |
| GET | `/permissions` | List all permissions |
| GET | `/permissions/role/:roleId` | Get role permissions |
| POST | `/permissions/role/:roleId` | Assign permissions |

**Default Role Templates:**
- **ADMIN** - Full system access
- **MANAGER** - Organization management, reports, user management
- **AGENT** - Package operations, transactions
- **CUSTOMER** - View packages, track deliveries

---

### 📱 Devices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/devices` | List all devices |
| GET | `/devices/:id` | Get device by ID |
| POST | `/devices` | Register device |
| PUT | `/devices/:id` | Update device |
| DELETE | `/devices/:id` | Remove device |
| POST | `/devices/:id/trust` | Mark device as trusted |
| POST | `/devices/:id/untrust` | Remove trust |

---

### 🔔 WebSocket Events

Connect to WebSocket at `ws://localhost:3000`

**Events:**
| Event | Direction | Description |
|-------|-----------|-------------|
| `package:created` | Server → Client | New package created |
| `package:updated` | Server → Client | Package updated |
| `package:delivered` | Server → Client | Package delivered |
| `transaction:status` | Server → Client | Transaction status changed |
| `notification` | Server → Client | Real-time notification |

---

## 🔒 Security Features

- **Rate Limiting** - 100 requests/minute per IP
- **JWT Authentication** - Access & refresh tokens
- **RBAC Guards** - Role-based endpoint protection
- **Input Validation** - class-validator on all DTOs
- **SQL Injection Prevention** - Parameterized queries via Drizzle
- **Password Hashing** - bcrypt with salt rounds
- **CORS Configuration** - Configurable origin whitelist

---

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 📝 Scripts

```bash
npm run start:dev    # Start development server
npm run start:prod   # Start production server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run migration:run    # Run database migrations
npm run migration:generate  # Generate new migration
npm run seed         # Seed database with initial data
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">

**Built with ❤️ by the FinalDrop Team**

</div>
