
# PocketBase Better Auth Adapter

> A complete, production-ready adapter to use [Better Auth](https://better-auth.com) with [PocketBase](https://pocketbase.io) as your authentication backend. This README is your single source for setup, usage, development, deployment, troubleshooting, and deep technical reference.

---

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Installation](#installation)
- [PocketBase Schema Setup](#pocketbase-schema-setup)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Development Guide](#development-guide)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Resources & Links](#resources--links)

---

## Features
- 🔐 **Full Better Auth support**: Sessions, accounts, verifications, and more
- 🗄️ **PocketBase-native**: Uses PocketBase collections and admin API
- 🛠️ **TypeScript-first**: Fully typed, with type definitions included
- 🧩 **Plug-and-play**: Works with Next.js, Express, and any Node backend
- 📝 **Customizable**: Use singular or plural table names, debug logging, and more
- 🧪 **Tested**: 17+ unit tests, robust error handling

---

## How It Works

This adapter implements the [Better Auth adapter factory API](https://better-auth.com/docs/concepts/database#adapters) using PocketBase as the backend. It translates Better Auth's CRUD operations into PocketBase collection queries, handling:

- **Admin authentication** (never expose admin credentials to the client!)
- **Where clause translation**: Converts Better Auth queries to PocketBase filter strings
- **Pagination**: Maps limit/offset to PocketBase's page/perPage
- **Batch operations**: Emulates `updateMany`/`deleteMany` by fetching and looping
- **Type safety**: All operations are fully typed

---

## Installation

```bash
pnpm add pocketbase-better-auth better-auth pocketbase
# or
npm install pocketbase-better-auth better-auth pocketbase
```

---

- 🔐 **Full Better Auth support**: Sessions, accounts, verifications, and more
- 🗄️ **PocketBase-native**: Uses PocketBase collections and admin API
- 🛠️ **TypeScript-first**: Fully typed, with type definitions included
- 🧩 **Plug-and-play**: Works with Next.js, Express, and any Node backend
- � **Customizable**: Use singular or plural table names, debug logging, and more
- � **Tested**: 17+ unit tests, robust error handling

---

```bash
pnpm add pocketbase-better-auth better-auth pocketbase
# or
npm install pocketbase-better-auth better-auth pocketbase
```


## PocketBase Schema Setup

You must create the required collections in PocketBase. The easiest way is to import the provided schema:

1. Open PocketBase admin dashboard (`http://127.0.0.1:8090/_/`)
2. Go to **Settings > Import collections**
3. Import `schema/pocketbase.collections.json` from this repo
4. Click **Import**

**Collections created:**

- `user` / `users`
- `session` / `sessions`
- `account` / `accounts`
- `verification` / `verifications`

> **Note:** Set `usePlural: true` in the adapter if you use plural names.

---


## Usage

### 1. Basic Setup

```typescript
import { betterAuth } from "better-auth";
import { pocketBaseAdapter } from "pocketbase-better-auth";
import PocketBase from "pocketbase";

const pb = new PocketBase("http://127.0.0.1:8090");
await pb.admins.authWithPassword("admin@example.com", "your-admin-password");

export const auth = betterAuth({
  database: pocketBaseAdapter({
    pb,
    usePlural: false, // or true if you use plural collection names
    debugLogs: false, // set true for verbose logs
  }),
  emailAndPassword: { enabled: true },
});
```


### 2. Using Environment Variables (Email/Password or JWT Token)

```typescript
export const auth = betterAuth({
  database: pocketBaseAdapter({
    pb: {
      url: process.env.POCKETBASE_URL || "http://127.0.0.1:8090",
      // Option 1: Email/password (classic)
      adminEmail: process.env.POCKETBASE_ADMIN_EMAIL,
      adminPassword: process.env.POCKETBASE_ADMIN_PASSWORD,
      // Option 2: JWT admin token (recommended for serverless/CI)
      token: process.env.POCKETBASE_TOKEN,
    },
    usePlural: true,
    debugLogs: process.env.NODE_ENV === "development",
  }),
  emailAndPassword: { enabled: true },
});
```

> If both `token` and `adminEmail`/`adminPassword` are provided, the adapter will use the token.

### 3. API Route Example (Next.js App Router)

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
export const { GET, POST } = auth.handler;
```

### 4. Client Usage Example

```typescript
import { createAuthClient } from "better-auth/client";
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});
export const { useSession, signIn, signOut, signUp } = authClient;
```


## API Reference

### `pocketBaseAdapter(options)`

| Option      | Type                                                        | Default   | Description                                      |
|-------------|-------------------------------------------------------------|-----------|--------------------------------------------------|
| `pb`        | `PocketBase \| { url: string; adminEmail?: string; adminPassword?: string }` | (required) | PocketBase instance or config object             |
| `usePlural` | `boolean`                                                   | `true`    | Use plural collection names (users, sessions, ...) |
| `debugLogs` | `boolean`                                                   | `false`   | Enable debug logging                             |


---

## Project Structure

```
├── src/
│   ├── index.ts         # Main adapter implementation
│   └── index.test.ts    # Unit tests
├── schema/
│   └── pocketbase.collections.json  # Importable PocketBase schema
├── dist/                # Build output
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
```

---

## Environment Variables


```env
# PocketBase connection
POCKETBASE_URL=http://127.0.0.1:8090
# Option 1: Email/password
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=your-admin-password
# Option 2: JWT admin token (recommended for CI/serverless)
POCKETBASE_TOKEN=your-pocketbase-admin-jwt-token
```

---


---

## Development Guide

### 1. Install & Build

```bash
pnpm install
pnpm build
```

### 2. Run Tests

```bash
pnpm test
```

### 3. Lint

```bash
pnpm lint
```

### 4. Adapter Structure

- `src/index.ts`: Exports `pocketBaseAdapter`, implements all CRUD methods required by Better Auth
- `parseWhere`: Converts Better Auth `Where` clauses to PocketBase filter strings
- Handles admin authentication, error handling, and debug logging

### 5. How to Extend

- Add new fields to the schema and update `parseWhere` if you need new query operators
- Add custom logging or hooks as needed

---

## Deployment

1. **Build the package:**
  ```bash
  pnpm build
  ```
2. **Publish to npm (optional):**
  ```bash
  npm publish
  ```
3. **Use in your app:**
  - Import and configure as shown above

---

## Troubleshooting

### "Cannot connect to PocketBase"
- Ensure PocketBase is running and the URL is correct
- Check your `POCKETBASE_URL` env variable

### "Admin authentication failed"
- Verify admin email/password
- Ensure the admin account exists in PocketBase

### "Collection not found"
- Import the schema file in PocketBase admin dashboard
- Ensure `usePlural` matches your collection names

### "Operation not permitted"
- Make sure you are using admin credentials (never expose these to the client!)

---

## Security

- ⚠️ **Never expose admin credentials to client-side code**
- Always use environment variables for sensitive data
- Run the adapter server-side only
- Set PocketBase collection rules to restrict access as needed

---

## Resources & Links

- [Better Auth Documentation](https://better-auth.com)
- [PocketBase Documentation](https://pocketbase.io/docs/)
- [GitHub Repository](https://github.com/Lightinn/pocketbase-better-auth)
- [Reference: better-auth-instantdb](https://github.com/daveyplate/better-auth-instantdb)
- [Reference: remult-better-auth](https://github.com/nerdfolio/remult-better-auth)

---

## License

MIT
