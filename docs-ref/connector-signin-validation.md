# Connector Identifier Validation

**File paths**
- `packages/core/src/routes/interaction/utils/sign-in-experience-validation.ts`
- `packages/core/src/routes/interaction/utils/sign-in-experience-valiation.test.ts`

**Key changes**
- Skipped sign-in experience checks for identifiers that include `connectorId`.
- Connector-specific logic is now responsible for validating these identifiers.
- Added tests ensuring social sign-in flows bypass generic validation while email and phone flows remain checked.

**New dependencies / environment variables**
- None.
