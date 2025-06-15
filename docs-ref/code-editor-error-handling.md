# CodeEditor Required Error Handling

**File paths**
- `packages/console/src/ds-components/CodeEditor/index.tsx`
- `packages/console/src/ds-components/__tests__/CodeEditor.test.tsx`

**Key changes**
- Refactored the component to treat empty error strings as errors.
- Added a `hasError` flag so boolean or empty-string errors render the default required message.
- Provided tests covering custom messages and fallback behaviour.

**New dependencies / environment variables**
- None.
