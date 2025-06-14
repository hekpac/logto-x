# Random String Helper

**File paths**
- `packages/shared/src/utils/random-string.ts`
- `packages/shared/src/utils/random-string.test.ts`
- `packages/shared/src/utils/index.ts`
- `packages/core/src/routes/one-time-tokens.ts`

**Key changes**
- Added `generateRandomString(length)` utility using `nanoid`.
- Applied the helper in one-time token generation with a 32 character token.
- Provided unit tests covering length and character set.

**New dependencies / environment variables**
- None.
