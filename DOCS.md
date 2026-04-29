# Full-Stack Boilerplate — Complete Documentation

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT                             │
└──────────────────────────┬──────────────────────────────┘
                           │
                    port 3000
                           │
┌──────────────────────────▼──────────────────────────────┐
│                   API GATEWAY                           │
│         Proxies requests to downstream services         │
│         JWT validation on protected routes              │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
      port 3001                  port 3002
           │                          │
┌──────────▼──────────┐   ┌──────────▼──────────┐
│   AUTH SERVICE      │   │   USER SERVICE      │
│  Register / Login   │   │  Profile CRUD       │
│  JWT generation     │   │  JWT validation     │
│  Refresh tokens     │   │                     │
└──────────┬──────────┘   └──────────┬──────────┘
           │                          │
      port 5432                  port 5432
  (host: 5434)               (host: 5433)
           │                          │
┌──────────▼──────────┐   ┌──────────▼──────────┐
│     auth-db         │   │     user-db         │
│  PostgreSQL 16      │   │  PostgreSQL 16      │
└─────────────────────┘   └─────────────────────┘
```

---

## Project Structure

```
fullstack-boilerplate/
├── docker-compose.yml
├── DOCS.md
├── auth-service/
│   ├── Dockerfile
│   ├── .env                        ← localhost:5434 (host migrations)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── prisma.service.ts
│       └── auth/
│           ├── auth.module.ts
│           ├── auth.controller.ts
│           ├── auth.service.ts
│           ├── dto/
│           │   ├── register.dto.ts
│           │   ├── login.dto.ts
│           │   ├── refresh.dto.ts
│           │   └── logout.dto.ts
│           ├── guards/
│           │   └── jwt.guard.ts
│           └── decorators/
│               └── current-user.decorator.ts
├── user-service/
│   ├── Dockerfile
│   ├── .env                        ← localhost:5433 (host migrations)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── prisma.service.ts
│       └── users/
│           ├── users.module.ts
│           ├── users.controller.ts
│           ├── users.service.ts
│           ├── dto/
│           │   ├── create-profile.dto.ts
│           │   └── update-profile.dto.ts
│           ├── guards/
│           │   └── jwt.guard.ts
│           └── decorators/
│               └── current-user.decorator.ts
└── api-gateway/
    ├── Dockerfile
    └── src/
        ├── main.ts
        ├── app.module.ts
        ├── auth-proxy/
        │   ├── auth-proxy.module.ts
        │   └── auth-proxy.controller.ts
        ├── users-proxy/
        │   ├── users-proxy.module.ts
        │   └── users-proxy.controller.ts
        └── common/
            ├── guards/
            │   └── jwt.guard.ts
            └── decorators/
                └── current-user.decorator.ts
```

---

## Environment Variables

### auth-service `.env` (for host migrations)
```env
DATABASE_URL="postgresql://auth_user:auth_pass@localhost:5434/auth_db?schema=public"
JWT_ACCESS_SECRET=access-secret-change-in-production-min-32-chars
JWT_REFRESH_SECRET=refresh-secret-change-in-production-min-32-chars
```

### user-service `.env` (for host migrations)
```env
DATABASE_URL="postgresql://user_user:user_pass@localhost:5433/user_db?schema=public"
JWT_ACCESS_SECRET=access-secret-change-in-production-min-32-chars
```

### docker-compose environment (inside containers)
| Variable | auth-service | user-service | api-gateway |
|---|---|---|---|
| DATABASE_URL | `auth-db:5432` | `user-db:5432` | — |
| JWT_ACCESS_SECRET | ✓ | ✓ | ✓ |
| JWT_REFRESH_SECRET | ✓ | — | — |
| AUTH_SERVICE_URL | — | — | `http://auth-service:3001` |
| USER_SERVICE_URL | — | — | `http://user-service:3002` |

---

## Database Schemas

### auth-service (auth-db)

```prisma
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  passwordHash  String
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  deletedAt     DateTime?
  refreshTokens RefreshToken[]
  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  expiresAt DateTime
  @@map("refresh_tokens")
}
```

### user-service (user-db)

```prisma
model User {
  id        String    @id @default(uuid())
  authId    String    @unique    // links to auth-service User.id
  email     String    @unique
  name      String?
  bio       String?
  avatarUrl String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?
  @@map("users")
}
```

---

## API Endpoints

### Via API Gateway (port 3000) — use this in production

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, get token pair |
| POST | `/api/auth/refresh` | Public | Rotate refresh token |
| POST | `/api/auth/logout` | Public | Invalidate refresh token |
| GET | `/api/auth/me` | JWT | Get current user from token |
| POST | `/api/users/profile` | JWT | Create user profile |
| GET | `/api/users/profile` | JWT | Get my profile |
| PATCH | `/api/users/profile` | JWT | Update my profile |
| GET | `/api/users/:id` | JWT | Get user by ID |

### Direct service access (development only)

| Service | Swagger UI |
|---|---|
| API Gateway | http://localhost:3000/api/docs |
| Auth Service | http://localhost:3001/api/docs |
| User Service | http://localhost:3002/api/docs |

---

## Port Reference

| Container | Internal Port | Host Port |
|---|---|---|
| auth-db | 5432 | **5434** |
| user-db | 5432 | **5433** |
| auth-service | 3001 | 3001 |
| user-service | 3002 | 3002 |
| api-gateway | 3000 | 3000 |

---

## Running the Project

### First-time setup (run once)

```bash
cd /home/biraj/cts-projects/cts-projects/fullstack-boilerplate

# 1. Install dependencies
cd auth-service && npm install --legacy-peer-deps && cd ..
cd user-service && npm install --legacy-peer-deps && cd ..
cd api-gateway  && npm install --legacy-peer-deps && cd ..

# 2. Start databases
docker compose up -d auth-db user-db

# 3. Wait for healthy, then run migrations
sleep 15
cd auth-service && npx prisma migrate dev --name init && cd ..
cd user-service && npx prisma migrate dev --name init && cd ..

# 4. Build and start all services
docker compose up --build
```

### Daily start (after first-time setup)

```bash
docker compose up
```

### Rebuild after code changes

```bash
docker compose up --build
```

### All-in-one first-time command

```bash
cd /home/biraj/cts-projects/cts-projects/fullstack-boilerplate && \
cd auth-service && npm install --legacy-peer-deps && cd .. && \
cd user-service && npm install --legacy-peer-deps && cd .. && \
cd api-gateway  && npm install --legacy-peer-deps && cd .. && \
docker compose up -d auth-db user-db && sleep 15 && \
cd auth-service && npx prisma migrate dev --name init && cd .. && \
cd user-service && npx prisma migrate dev --name init && cd .. && \
docker compose up --build
```

---

## Testing the API

### 1. Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

### 2. Login (save the tokens)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Response:
# { "accessToken": "eyJ...", "refreshToken": "eyJ..." }
```

### 3. Get current user (protected)
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

### 4. Create profile
```bash
curl -X POST http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"authId":"<sub from token>","email":"test@test.com"}'
```

### 5. Update profile
```bash
curl -X PATCH http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","bio":"TypeScript dev"}'
```

### 6. Refresh tokens
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

### 7. Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

---

## Useful Commands

```bash
# View logs for a specific service
docker compose logs auth-service -f
docker compose logs user-service -f
docker compose logs api-gateway -f

# Check all container statuses
docker compose ps

# Stop everything
docker compose down

# Stop and remove volumes (wipes all DB data)
docker compose down -v

# Connect to auth-db from host
psql -h localhost -p 5434 -U auth_user -d auth_db

# Connect to user-db from host
psql -h localhost -p 5433 -U user_user -d user_db

# Run a new migration after schema change
cd auth-service && npx prisma migrate dev --name <migration-name>
cd user-service && npx prisma migrate dev --name <migration-name>

# Open Prisma Studio (visual DB browser)
cd auth-service && npx prisma studio            # → http://localhost:5555
cd user-service && npx prisma studio --port 5556 # → http://localhost:5556
```

---

## JWT Token Structure

### Access Token payload (expires 15 minutes)
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "iat": 1714000000,
  "exp": 1714000900
}
```

### Refresh Token payload (expires 7 days)
```json
{
  "sub": "user-uuid",
  "iat": 1714000000,
  "exp": 1714604800
}
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `port already allocated` | Host PostgreSQL running | `sudo systemctl stop postgresql` |
| `P1000: Authentication failed` | Wrong port in `.env` | auth-db → `localhost:5434`, user-db → `localhost:5433` |
| `P1001: Can't reach database` | Wrong port in docker-compose | Container URLs must use `5432` not `5434/5433` |
| `libssl.so.1.1 not found` | Missing OpenSSL in Alpine | Add `RUN apk add --no-cache openssl` to Dockerfile |
| `ERESOLVE` on npm install | `@nestjs/swagger@8` peer conflict with NestJS 11 | Use `npm install --legacy-peer-deps` |
| `Cannot find module @nestjs/jwt` | Package not installed | Run `npm install --legacy-peer-deps` |
| `Property refreshToken does not exist` | Prisma client not regenerated | Run `npx prisma migrate dev` or `npx prisma generate` |
