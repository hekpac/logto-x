import { logtoConsoleUrl as logtoConsoleUrlString, newOidcSsoConnectorPayload } from '#src/constants.js';
import { SsoConnectorApi } from '#src/api/sso-connector.js';
import { goToConsole, expectToSaveChanges, waitForToast } from '#src/ui-helpers/index.js';
import { appendPathname, expectNavigation } from '#src/utils.js';

await page.setViewport({ width: 1920, height: 1080 });

describe('enterprise sso branding cleanup', () => {
  const api = new SsoConnectorApi();
  const logtoConsoleUrl = new URL(logtoConsoleUrlString);
  let connectorId: string;

  beforeAll(async () => {
    const connector = await api.create({
      ...newOidcSsoConnectorPayload,
      branding: {
        displayName: 'Cleanup',
        logo: 'https://logto.io/logo.png',
        darkLogo: 'https://logto.io/logo-dark.png',
      },
    });
    connectorId = connector.id;
    await goToConsole();
    await expectNavigation(
      page.goto(
        appendPathname(`/console/enterprise-sso/${connectorId}/experience`, logtoConsoleUrl).href
      )
    );
  });

  afterAll(async () => {
    await api.cleanUp();
  });

  it('should omit empty branding fields in patch request', async () => {
    const patchRequestPromise = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        request.url().includes(`/api/sso-connectors/${connectorId}`)
    );

    await expect(page).toFillForm('form', {
      'branding.displayName': '',
      'branding.logo': '',
      'branding.darkLogo': '',
    });

    await expectToSaveChanges(page);
    await waitForToast(page, { text: 'Saved' });

    const patchRequest = await patchRequestPromise;
    const body = JSON.parse(patchRequest.postData() ?? '{}');
    expect(body).not.toHaveProperty('branding');
  });

  it('should keep non-empty branding fields in patch request', async () => {
    const patchRequestPromise = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' &&
        request.url().includes(`/api/sso-connectors/${connectorId}`)
    );

    await expect(page).toFillForm('form', {
      'branding.displayName': 'Updated name',
      'branding.logo': '',
      'branding.darkLogo': '',
    });

    await expectToSaveChanges(page);
    await waitForToast(page, { text: 'Saved' });

    const patchRequest = await patchRequestPromise;
    const body = JSON.parse(patchRequest.postData() ?? '{}');
    expect(body.branding).toEqual({ displayName: 'Updated name' });
  });
});
