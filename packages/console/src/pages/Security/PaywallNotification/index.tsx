import { Trans, useTranslation } from 'react-i18next';

import ContactUsPhraseLink from '@/components/ContactUsPhraseLink';
import useAddOnPricing from '@/hooks/use-add-on-pricing';
import InlineNotification from '@/ds-components/InlineNotification';
import usePaywall from '@/hooks/use-paywall';
import useTenantPathname from '@/hooks/use-tenant-pathname';
import useUserPreferences from '@/hooks/use-user-preferences';

type Props = {
  readonly className?: string;
};

function PaywallNotification({ className }: Props) {
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });
  const { navigate } = useTenantPathname();

  const { isFreeTenant, isPaidTenant } = usePaywall();

  const {
    data: { securityFeaturesUpsellNoticeAcknowledged },
    update,
  } = useUserPreferences();
  const { data: addOnPrices } = useAddOnPricing();

  if (isFreeTenant) {
    return (
      <InlineNotification
        className={className}
        action="upsell.upgrade_plan"
        actionButtonProps={{
          type: 'primary',
          size: 'medium',
        }}
        onClick={() => {
          navigate('/tenant-settings/subscription');
        }}
      >
        <Trans
          components={{
            a: <ContactUsPhraseLink />,
          }}
        >
          {t('upsell.paywall.security_features')}
        </Trans>
      </InlineNotification>
    );
  }

  if (isPaidTenant && !securityFeaturesUpsellNoticeAcknowledged) {
    return (
      <InlineNotification
        className={className}
        action="general.got_it"
        onClick={async () => update({ securityFeaturesUpsellNoticeAcknowledged: true })}
      >
        {t('upsell.add_on.security_features_inline_notification', {
          price: addOnPrices.securityFeaturesEnabled,
        })}
      </InlineNotification>
    );
  }

  return null;
}

export default PaywallNotification;
