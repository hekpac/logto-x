import { type Page } from 'puppeteer';

import { dcls } from '../test-env-utils.js';

import { selectDropdownMenuItem } from './select-dropdown-menu-item-helper.js';

export const switchToLanguage = async (page: Page, language: string) => {
  await expect(page).toClick(`${dcls('topbar')} div:last-child`);
  await selectDropdownMenuItem(page, 'div[role=menuitem]', language);
};
