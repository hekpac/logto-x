import { type OrganizationRole, type OrganizationJitEmailDomain } from '@logto/schemas';

import { authedApi } from './api.js';
import { RelationApiFactory } from './factory.js';

export class OrganizationJitApi {
  roles = new RelationApiFactory<OrganizationRole>({
    basePath: 'organizations',
    relationPath: 'jit/roles',
    relationKey: 'organizationRoleIds',
  });

  ssoConnectors = new RelationApiFactory({
    basePath: 'organizations',
    relationPath: 'jit/sso-connectors',
    relationKey: 'ssoConnectorIds',
  });

  constructor(public path: string) {}

  async getEmailDomains(
    id: string,
    page?: number,
    pageSize?: number
  ): Promise<OrganizationJitEmailDomain[]> {
    const searchParams = new URLSearchParams();

    if (page) {
      searchParams.append('page', String(page));
    }

    if (pageSize) {
      searchParams.append('page_size', String(pageSize));
    }

    return authedApi
      .get(`${this.path}/${id}/jit/email-domains`, { searchParams })
      .json<OrganizationJitEmailDomain[]>();
  }

  async addEmailDomain(id: string, emailDomain: string): Promise<void> {
    await authedApi.post(`${this.path}/${id}/jit/email-domains`, { json: { emailDomain } });
  }

  async deleteEmailDomain(id: string, emailDomain: string): Promise<void> {
    await authedApi.delete(`${this.path}/${id}/jit/email-domains/${emailDomain}`);
  }

  async replaceEmailDomains(id: string, emailDomains: string[]): Promise<void> {
    await authedApi.put(`${this.path}/${id}/jit/email-domains`, { json: { emailDomains } });
  }
}
