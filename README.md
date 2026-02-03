# Modular Monolith

A production-ready modular monolith using Express.js, TypeScript, DDD, and Turborepo.

## Architecture Overview

```
apps/
  api/                     → Express application (single deployable)

packages/
  auth/                    → Auth bounded context
  users/                   → Users bounded context
  billing/                 → Billing bounded context
  shared/                  → Shared kernel (base abstractions, types)
  config/                  → Shared TypeScript/ESLint configuration
  db/                      → Database connection primitives
```

## Key Architectural Decisions

### 1. Modular Monolith (NOT Microservices)

This is a **single deployable** with strong internal module boundaries. Benefits:
- Simple deployment and operations
- No network overhead between modules
- Shared database with clear ownership
- Easy refactoring and code reuse
- Clear path to microservices if needed later

### 2. Domain-Driven Design

Each domain package represents a **bounded context**:

```
packages/auth/src/
  domain/                  → Entities, value objects, domain events
  application/             → Use cases (application services)
  infrastructure/
    http/                  → Express routers
    persistence/           → Repository implementations
    migrations/            → Database migrations (owned by domain)
  index.ts                 → Public API ONLY
```

### 3. Module Boundaries

- Domains **cannot** import from other domains directly
- Only the public API (`index.ts`) is importable
- Inter-domain communication uses **domain events**
- Turborepo boundaries enforce these rules at build time

### 4. Explicit Dependencies

- No global service locators or DI containers
- Dependencies are passed explicitly via factory functions
- Example: `createAuthRouter(deps)` receives all dependencies

### 5. Database Per Domain (Logical)

- Single physical database
- Each domain owns its tables (prefixed: `auth_`, `users_`, `billing_`)
- Each domain owns its migrations
- No cross-domain table access

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL

# Run migrations
pnpm db:migrate

# Development
pnpm dev

# Build
pnpm build

# Run tests
pnpm test
```

## Domain Communication

Domains communicate via events, not direct imports:

```typescript
// Auth domain publishes
await eventBus.publish(new UserRegisteredEvent(userId, email));

// Users domain subscribes (in module.ts)
eventBus.subscribe("auth.user_registered", async (event) => {
  // Create user profile
});
```

## Adding a New Domain

1. Create package structure:
   ```
   packages/new-domain/
     src/
       domain/
       application/
       infrastructure/
         http/
         persistence/
         migrations/
       index.ts
       module.ts
     package.json
     tsconfig.json
   ```

2. Add to Turborepo boundaries in `turbo.json`

3. Register in `apps/api/src/bootstrap.ts`:
   ```typescript
   const newModule = createNewDomainModule({ db, eventBus });
   // Mount router
   app.use("/new-domain", newModule.router);
   ```

4. Register migrations in migration runner

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build all packages |
| `pnpm test` | Run tests |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type check all packages |
| `pnpm db:migrate` | Run database migrations |
| `pnpm clean` | Clean all build outputs |

## Project Structure

```
.
├── apps/
│   └── api/                        # Express application
│       └── src/
│           ├── server.ts           # Entry point
│           ├── bootstrap.ts        # Composition root
│           └── app.ts              # Express factory
├── packages/
│   ├── auth/                       # Auth domain
│   │   └── src/
│   │       ├── domain/
│   │       │   ├── entities/
│   │       │   ├── value-objects/
│   │       │   ├── events/
│   │       │   └── repositories/
│   │       ├── application/
│   │       │   ├── use-cases/
│   │       │   ├── dtos.ts
│   │       │   └── errors.ts
│   │       ├── infrastructure/
│   │       │   ├── http/
│   │       │   ├── persistence/
│   │       │   └── migrations/
│   │       ├── module.ts
│   │       └── index.ts            # Public API
│   ├── users/                      # Users domain
│   ├── billing/                    # Billing domain
│   ├── shared/                     # Shared kernel
│   │   └── src/
│   │       ├── entity.ts
│   │       ├── value-object.ts
│   │       ├── domain-event.ts
│   │       ├── result.ts
│   │       └── types.ts
│   ├── config/                     # Shared configuration
│   └── db/                         # Database primitives
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

## Why Not NestJS?

This architecture intentionally avoids magic and implicit behavior:

- **No decorators** - Dependencies are explicit
- **No reflection** - Everything is statically analyzable
- **No DI container** - Simple factory functions
- **No modules with side effects** - Pure composition

The result is boring, explicit code that's easy to understand and debug.
