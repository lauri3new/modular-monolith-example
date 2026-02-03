# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev                              # Start dev server with hot reload
pnpm build                            # Build all packages
pnpm typecheck                        # Type check all packages
pnpm lint                             # Lint all packages
pnpm test                             # Run all tests
pnpm db:migrate                       # Run database migrations

# Single package operations
pnpm --filter @acme/auth test         # Test single package
pnpm --filter @acme/auth build        # Build single package
pnpm --filter @acme/api dev           # Run just the API in dev mode
```

## Architecture

This is a **modular monolith** (single deployable, not microservices) using DDD with strict module boundaries.

### Package Dependency Rules (enforced by Turborepo boundaries)

```
@acme/api (app)
    ↓ imports from
@acme/auth, @acme/users, @acme/billing (domain)
    ↓ imports from
@acme/db (infrastructure), @acme/shared (shared kernel)
    ↓ imports from
@acme/config
```

**Critical rules:**
- Domain packages CANNOT import from other domain packages
- Only import from a package's `index.ts` (no deep imports)
- Inter-domain communication happens via domain events through `EventBus`

### Domain Package Structure

Each domain (`auth`, `users`, `billing`) follows this structure:
```
src/
  domain/           → Entities, value objects, domain events, repository interfaces
  application/      → Use cases, DTOs, error classes
  infrastructure/
    http/           → Express router (createXxxRouter factory)
    persistence/    → Repository implementations
    migrations/     → SQL migrations (domain owns its tables)
  module.ts         → Module factory (createXxxModule)
  index.ts          → PUBLIC API ONLY - the only file importable by other packages
```

### Composition Root

`apps/api/src/bootstrap.ts` is where all wiring happens:
1. Initializes database connection
2. Creates shared EventBus
3. Runs all domain migrations
4. Creates domain modules with explicit dependency injection
5. Mounts domain routers to Express app

### Adding a New Domain

1. Create package with structure above under `packages/new-domain/`
2. Add boundary tag in `turbo.json` under `boundaries.tags`
3. Register module in `bootstrap.ts`:
   ```typescript
   const newModule = createNewDomainModule({ db, eventBus });
   ```
4. Mount router and register migrations

### Database Conventions

- Single PostgreSQL database
- Tables prefixed by domain: `auth_`, `users_`, `billing_`
- Each domain owns its migrations in `infrastructure/migrations/`
- No cross-domain table access; use events instead

### Domain Events Pattern

```typescript
// Publishing (in use case)
await eventBus.publish(new UserRegisteredEvent(userId, email));

// Subscribing (in module.ts)
eventBus.subscribe("auth.user_registered", async (event) => { ... });
```

### Shared Kernel (@acme/shared)

Contains only base DDD abstractions (`Entity`, `ValueObject`, `DomainEvent`, `Result`) and branded types (`UserId`, `Email`). Keep small and stable—changes affect all domains.
