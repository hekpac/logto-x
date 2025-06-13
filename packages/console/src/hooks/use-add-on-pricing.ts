import { useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';

import { useCloudApi } from '@/cloud/hooks/use-cloud-api';
import { type LogtoSkuResponse } from '@/cloud/types/router';
import { isCloud } from '@/consts/env';
import { addOnSkuIdMap, type AddOnUsageKey } from '@/consts/add-on-sku-ids';
import { LogtoSkuType } from '@/types/skus';

/**
 * Fetch add-on pricing information from the cloud API.
 *
 * The API returns add-on SKUs with their unit prices. This hook
 * converts the response to a record keyed by SKU id for easy lookup.
 */
const useAddOnPricing = () => {
  const cloudApi = useCloudApi();

  const swrResponse = useSWRImmutable<LogtoSkuResponse[], Error>(
    isCloud && '/api/skus?type=AddOn',
    async () =>
      cloudApi.get('/api/skus', {
        search: { type: LogtoSkuType.AddOn },
      })
  );

  const { data } = swrResponse;

  const priceMap = useMemo(() => {
    const map: Record<AddOnUsageKey, number> = {
      resourcesLimit: 0,
      machineToMachineLimit: 0,
      tenantMembersLimit: 0,
      mfaEnabled: 0,
      enterpriseSsoLimit: 0,
      organizationsLimit: 0,
      tokenLimit: 0,
      hooksLimit: 0,
      securityFeaturesEnabled: 0,
    };

    data?.forEach((sku) => {
      const usageKey = Object.entries(addOnSkuIdMap).find(
        ([, id]) => id === sku.id
      )?.[0] as AddOnUsageKey | undefined;

      if (usageKey) {
        map[usageKey] = sku.unitPrice ?? 0;
      }
    });

    return map;
  }, [data]);

  return { ...swrResponse, data: priceMap };
};

export default useAddOnPricing;
