# COEP Header and Token Revocation Logs

**File paths**
- `packages/core/src/middleware/koa-security-headers.ts`
- `packages/core/src/event-listeners/grant.ts`
- `packages/core/src/event-listeners/utils.ts`

**Key changes**
- Restored the Cross-Origin-Embedder-Policy header after Google One Tap updated its CORP response.
- Updated token revocation logging to include user information extracted from access or refresh tokens.

**New dependencies / environment variables**
- None.
