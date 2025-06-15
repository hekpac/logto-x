# MongoDB, Redis and OpenSearch Migration

**File paths**
- `packages/core/src/models/system.ts`
- `packages/core/src/queries/system.ts`
- `.github/workflows/main.yml`

**Key changes**
- Introduced Mongoose `SystemModel` replacing slonik queries.
- Updated system context and tenant utils to use MongoDB.
- Workflow now starts MongoDB, Redis and OpenSearch services via Docker Compose.

**New dependencies / environment variables**
- `MONGODB_URI` is required for all commands.
- `REDIS_URL` and `OPENSEARCH_URL` optional for caching and search.
