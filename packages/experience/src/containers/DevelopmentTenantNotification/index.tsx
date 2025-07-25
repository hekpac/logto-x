import { useContext, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import PageContext from '@/Providers/PageContextProvider/PageContext';
import DevIcon from '@/assets/icons/dev-icon.svg?react';

/**
 * Styles that may effect the visibility of a DOM element.
 */
const visibilityRelatedStyles: Record<string, string> = Object.freeze({
  visibility: 'visible',
  height: 'unset',
  width: 'unset',
  transform: 'unset',
  opacity: 'unset',
  position: 'static',
});

/** Build styles that will always be visible for a DOM element based on given styles */
const buildPermanentVisibleStyles = (styles: Record<string, string>) => ({
  ...visibilityRelatedStyles,
  ...styles,
});

/**
 * Apply inline styles with '!important' to a DOM element to make these styles become the highest priority.
 *
 * It's useful when we want to ensure these styles won't be override via the user's custom CSS config.
 */
const applyInlineStylesWithImportant = (element: HTMLElement, styles: Record<string, string>) => {
  for (const [key, value] of Object.entries(styles)) {
    element.style.setProperty(key, value, 'important');
  }
};

/**
 * Notification for development tenants to notify the user that the tenant is in development mode
 *
 * It is shown for development tenants and will be hidden in the preview mode even the tenant is a development tenant
 */
const DevelopmentTenantNotification = () => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  /**
   * Add a ref to the icon to specify styles for the icon,
   * since we cannot use CSS selectors to select the icon from its parent node (notification) via inline CSS.
   */
  const iconRef = useRef<HTMLSpanElement>(null);
  const { experienceSettings, isPreview } = useContext(PageContext);
  const { isDevelopmentTenant } = experienceSettings ?? {};

  const styles: Record<string, string> = Object.freeze({
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    'align-self': 'stretch',
    gap: '8px',
    padding: '6px 16px',
    'border-radius': 'unset',
    background: 'var(--color-container-on-alert)',
    font: 'var(--font-label-2)',
    color: 'var(--color-static-white)',
    position: 'fixed',
    left: '0',
    right: '0',
    'z-index': '9999',
  });

  const iconStyles: Record<string, string> = Object.freeze({
    // Use 'display: inline-flex' and 'align-items: center' to vertically center the icon
    display: 'inline-flex',
    'align-items': 'center',
    color: 'var(--color-container-alert)',
  });

  useEffect(() => {
    if (isPreview || !ref.current || !iconRef.current) {
      return;
    }

    applyInlineStylesWithImportant(ref.current, buildPermanentVisibleStyles(styles));
    applyInlineStylesWithImportant(iconRef.current, buildPermanentVisibleStyles(iconStyles));
  }, [iconStyles, isDevelopmentTenant, isPreview, ref, styles]);

  if (!isDevelopmentTenant || isPreview) {
    return null;
  }

  return createPortal(
    <div ref={ref}>
      <span ref={iconRef}>
        <DevIcon />
      </span>
      {t('development_tenant.notification')}
    </div>,
    document.body
  );
};

export default DevelopmentTenantNotification;
