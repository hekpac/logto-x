# Connector Route Transactions

**File paths**
- `packages/core/src/routes/connector/index.ts`
- `packages/core/src/routes/connector/index.delete.test.ts`

**Key changes**
- Connector removal now runs inside `queries.pool.transaction()`.
- Sign-in experience cleanup is executed within the same transaction.
- Added a test verifying rollback when the cleanup step fails.

**New dependencies / environment variables**
- None.
