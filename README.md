# FinalDrop Backend — Phase 1 (Week 1)

This README documents the implemented routes, current behavior, and next steps for Phase 1 Week 1.

## Summary
- Stack: NestJS, TypeScript, TypeORM (temporary), PostgreSQL
- Auth: JWT (access token) and refresh endpoint (simple re-sign currently)
- Multi-organization: Membership entity (TypeORM) implemented; switching supported
- RBAC: Guard + PolicyService implemented; Role entity contains `permissions` JSON column (DB-backed)

## Important notes
- The repository previously mixed Drizzle and TypeORM. For Phase‑1 we standardized on TypeORM for quick progress. Drizzle schema files are kept as stubs.
- Refresh tokens are currently implemented as simple JWT re-signing. Trusted-device + refresh-token rotation is TODO.

## Routes

Auth
- POST /auth/register — register a new user (body: RegisterDto)
- POST /auth/login — login with email/username + password (body: LoginDto). Returns { accessToken }
- POST /auth/refresh — refresh an access token (body: { refreshToken }) — currently verifies and re-signs the refresh token
- POST /auth/logout — placeholder (no-op)

Users
- GET /users — list users (requires auth + RBAC)
- GET /users/me — returns the currently-authenticated user (requires auth)
- GET /users/:id — get user by id
- GET /users/:id/organizations — list organizations the user belongs to (via memberships)
- POST /users — create user (admin)
- PUT /users/:id — update user (admin)
- DELETE /users/:id — delete user (admin)

Organizations
- POST /organizations — create organization (admin)
- GET /organizations — list organizations
- GET /organizations/:id — get organization
- DELETE /organizations/:id — delete organization (admin)
- POST /organizations/:id/switch — switch the current user's active organization (requires auth; user must be a member)

RBAC
- Use `@Roles('roleName')` on controllers/handlers to require roles. The `RbacGuard` reads `request.user.role` or `request.user.roles`.
- Role permissions may be stored in the `permissions` JSON column on `roles` and used by `PolicyService` in future work.

## Seeding
- Run `npm run seed` to create default roles and an example organization and admin user. Seed creates roles: `admin`, `manager`, `agent`.

## Tests
- Run `npm run test` to execute unit tests. A small set of unit tests are included for basic Auth and Org switching paths.

## Next steps (recommended)
1. Harden refresh tokens: persist refresh tokens per device, implement rotation and revocation.
2. Fully migrate DB to either Drizzle or keep TypeORM and remove Drizzle stubs.
3. Add migrations (not just `synchronize`) and wire them to Docker startup.
4. Expand RBAC to read `permissions` from DB dynamically (make PolicyService async).
5. Add more unit and integration tests for Auth and Org flows.
# FinalDrop Backend

FinalDrop is a NestJS application that implements authentication, multi-organization support, and role-based access control (RBAC) using Drizzle ORM and PostgreSQL. This project is designed with a focus on optimization, performance, and containerization using Docker.

## Features

- **Authentication**: Secure user authentication using JWT and local strategies.
- **Multi-Organization Support**: Ability to manage multiple organizations within the application.
- **Role-Based Access Control (RBAC)**: Fine-grained access control based on user roles.
- **Drizzle ORM**: Efficient database interactions with Drizzle ORM.
- **PostgreSQL**: Reliable and powerful relational database management system.
- **Docker**: Containerization for easy deployment and scalability.

## Project Structure

```
finaldrop-backend
├── .env.example
├── .gitignore
├── .prettierrc
├── eslint.config.mjs
├── nest-cli.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── Dockerfile
├── docker-compose.yml
├── drizzle.config.ts
├── README.md
├── src
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── config
│   │   ├── configuration.ts
│   │   └── database.config.ts
│   ├── db
│   │   ├── schema
│   │   │   ├── index.ts
│   │   │   ├── users.ts
│   │   │   ├── organizations.ts
│   │   │   ├── roles.ts
│   │   │   └── memberships.ts
│   │   └── migrations
│   │       └── README.md
│   ├── common
│   │   ├── decorators
│   │   │   ├── roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── guards
│   │   │   ├── auth.guard.ts
│   │   │   └── rbac.guard.ts
│   │   ├── filters
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors
│   │   │   └── logging.interceptor.ts
│   │   └── pipes
│   │       └── validation.pipe.ts
│   ├── auth
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── strategies
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   └── dto
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   ├── users
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   ├── dto
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   └── entities
│   │       └── user.entity.ts
│   ├── organizations
│   │   ├── organizations.module.ts
│   │   ├── organizations.service.ts
│   │   ├── organizations.controller.ts
│   │   ├── dto
│   │   │   └── create-organization.dto.ts
│   │   └── entities
│   │       └── organization.entity.ts
│   ├── roles
│   │   ├── roles.module.ts
│   │   ├── roles.service.ts
│   │   ├── roles.controller.ts
│   │   └── entities
│   │       └── role.entity.ts
│   ├── rbac
│   │   ├── rbac.module.ts
│   │   └── policy.service.ts
│   ├── drizzle
│   │   └── drizzle-client.ts
│   └── scripts
│       ├── seed.ts
│       └── migration-run.ts
├── test
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
└── .github
    └── workflows
        └── ci.yml
```

## Getting Started

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd finaldrop-backend
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Set up environment variables**:
   Copy `.env.example` to `.env` and fill in the required values.

4. **Run the application**:
   ```
   npm run start:dev
   ```

5. **Run with Docker**:
   ```
   docker-compose up --build
   ```

## Testing

To run the tests, use the following command:
```
npm run test
```

## License

This project is licensed under the MIT License. See the LICENSE file for more details.