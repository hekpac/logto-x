# Add-on Pricing from API

**File paths**
- `packages/console/src/hooks/use-add-on-pricing.ts`
- `packages/console/src/consts/add-on-sku-ids.ts`
- `packages/console/src/consts/subscriptions.ts`
- Various console components fetching add-on prices

**Key changes**
- Added `use-add-on-pricing` hook to retrieve add-on SKU pricing via the Cloud API.
- Replaced hard-coded price constants with the values returned by the API.
- Updated forms and usage components to display dynamic pricing.

**New dependencies / environment variables**
- None.
