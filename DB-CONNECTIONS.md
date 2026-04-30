# Database Connections — VS Code PostgreSQL Extension

## Connection Details

### auth-db
| Field | Value |
|---|---|
| Host | `localhost` |
| Port | `5434` |
| Database | `auth_db` |
| Username | `auth_user` |
| Password | `auth_pass` |
| SSL | disabled |

### user-db
| Field | Value |
|---|---|
| Host | `localhost` |
| Port | `5437` |
| Database | `user_db` |
| Username | `user_user` |
| Password | `user_pass` |
| SSL | disabled |

---

## Setup for Most Common Extensions

### Option A — SQLTools + SQLTools PostgreSQL Driver (recommended)

**Install:**
```
Ctrl+Shift+X → search "SQLTools" → install
Ctrl+Shift+X → search "SQLTools PostgreSQL" → install
```

**Add auth-db connection:**
1. Click the SQLTools icon in the sidebar (database icon)
2. Click `Add New Connection`
3. Select `PostgreSQL`
4. Fill in:
   - Connection Name: `auth-db`
   - Server: `localhost`
   - Port: `5434`
   - Database: `auth_db`
   - Username: `auth_user`
   - Password: `auth_pass`
5. Click `Test Connection` → `Save Connection`

**Add user-db connection:**
- Same steps with port `5433`, database `user_db`, username `user_user`, password `user_pass`

---

### Option B — PostgreSQL by Chris Kolkman

**Add connection via Command Palette:**
```
Ctrl+Shift+P → "PostgreSQL: Add Connection"
```

Fill in prompts:
```
Hostname:  localhost
Port:      5434          (or 5433 for user-db)
Username:  auth_user     (or user_user)
Password:  auth_pass     (or user_pass)
Database:  auth_db       (or user_db)
SSL:       Standard Connection
```

---

### Option C — Database Client (Weijin Wei)

**Add connection:**
1. Click Database icon in sidebar
2. Click `+` (Create Connection)
3. Select `PostgreSQL`
4. Fill in the fields below

---

## Connection Strings (for any tool)

```
# auth-db
postgresql://auth_user:auth_pass@localhost:5434/auth_db

# user-db
postgresql://user_user:user_pass@localhost:5433/user_db
```

---

## Useful Queries

```sql
-- List all tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- View all users (auth-db)
SELECT id, email, "createdAt", "deletedAt" FROM users;

-- View all refresh tokens (auth-db)
SELECT id, "userId", "expiresAt", "createdAt" FROM refresh_tokens;

-- View all user profiles (user-db)
SELECT id, "authId", email, name, bio, "avatarUrl" FROM users;

-- Count rows
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM refresh_tokens;

-- Delete expired refresh tokens (auth-db)
DELETE FROM refresh_tokens WHERE "expiresAt" < NOW();

-- Soft-deleted users
SELECT * FROM users WHERE "deletedAt" IS NOT NULL;
```

---

## Prerequisites

Databases must be running before connecting:

```bash
cd /home/biraj/cts-projects/cts-projects/fullstack-boilerplate
docker compose up -d auth-db user-db

# Confirm running
docker compose ps
```

Both containers must show `healthy` status.
