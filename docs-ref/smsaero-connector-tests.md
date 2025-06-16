# SMSAero Connector Test Cases

**File paths**
- `packages/connectors/connector-smsaero/src/index.test.ts`
- `packages/connectors/connector-smsaero/src/mock.ts`

**Key changes**
- Added unit tests covering:
  - successful message delivery with stored and input configuration
  - missing template handling
  - service error responses and invalid response bodies
  - invalid configuration passed directly or returned from `getConfig`
- Mocked network requests with `nock` and simulated `HTTPError` to exercise all branches.

**New dependencies / environment variables**
- None.
