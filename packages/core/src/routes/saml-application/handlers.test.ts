import { z } from 'zod';
import { createMockUtils } from '@logto/shared/esm';
import koaGuard from '#src/middleware/koa-guard.js';
import { MockTenant } from '#src/test-utils/tenant.js';
import { createRequester } from '#src/utils/test-utils.js';
import {
  createMetadataHandler,
  createRedirectBindingHandler,
  createPostBindingHandler,
} from './handlers.js';

const { jest } = import.meta;
const { mockEsm } = createMockUtils(jest);

const parseLoginRequest = jest.fn(async () => ({
  extract: { request: { id: 'req' }, issuer: 'sp' },
}));
const getSignInUrl = jest.fn(async () => new URL('https://signin.example/'));

mockEsm('#src/saml-application/SamlApplication/index.js', () => ({
  SamlApplication: jest.fn(() => ({
    idPMetadata: '<metadata/>',
    parseLoginRequest,
    getSignInUrl,
    config: { spEntityId: 'sp', redirectUri: 'http://callback' },
  })),
}));

const getDetails = jest.fn(async () => ({} as unknown as import('#src/queries/saml-application/index.js').SamlApplicationDetails));
const insertSession = jest.fn(async () => ({ id: 'sess' }));

const tenantContext = new MockTenant(undefined, {
  samlApplications: { getSamlApplicationDetailsById: getDetails },
  samlApplicationSessions: { insertSession },
});

const buildRouter = (router: any, tenant: any) => {
  router.get(
    '/saml-applications/:id/metadata',
    koaGuard({
      params: z.object({ id: z.string() }),
      status: [200, 400, 404],
      response: z.string(),
    }),
    createMetadataHandler(getDetails, tenant.envSet),
  );

  router.get(
    '/saml/:id/authn',
    koaGuard({
      params: z.object({ id: z.string() }),
      query: z
        .object({
          SAMLRequest: z.string().min(1),
          Signature: z.string().optional(),
          SigAlg: z.string().optional(),
          RelayState: z.string().optional(),
        })
        .catchall(z.string()),
      status: [200, 302, 400, 404],
    }),
    createRedirectBindingHandler(getDetails, insertSession, tenant.envSet),
  );

  router.post(
    '/saml/:id/authn',
    koaGuard({
      params: z.object({ id: z.string() }),
      body: z.object({
        SAMLRequest: z.string().min(1),
        RelayState: z.string().optional(),
      }),
      status: [200, 302, 400, 404],
    }),
    createPostBindingHandler(getDetails, insertSession, tenant.envSet),
  );
};

const request = createRequester({ anonymousRoutes: buildRouter, tenantContext });

describe('SAML application handlers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns metadata', async () => {
    const response = await request.get('/saml-applications/foo/metadata');
    expect(response.status).toBe(200);
    expect(response.text).toBe('<metadata/>');
    expect(getDetails).toHaveBeenCalledWith('foo');
  });

  it('handles redirect binding', async () => {
    const response = await request
      .get('/saml/foo/authn')
      .query({ SAMLRequest: 'req' });
    expect(parseLoginRequest).toHaveBeenCalledWith('redirect', {
      query: { SAMLRequest: 'req' },
      octetString: expect.any(String),
    });
    expect(response.status).toBe(302);
    expect(response.header.location).toBe('https://signin.example/');
  });

  it('handles post binding', async () => {
    const response = await request
      .post('/saml/foo/authn')
      .send({ SAMLRequest: 'req' });
    expect(parseLoginRequest).toHaveBeenCalledWith('post', {
      body: { SAMLRequest: 'req' },
    });
    expect(response.status).toBe(302);
    expect(response.header.location).toBe('https://signin.example/');
  });
});
