import {
  type EmailTemplateDetails,
  type CreateEmailTemplate,
  type EmailTemplate,
} from '@logto/schemas';

import { authedApi } from './index.js';

const path = 'email-templates';

export class EmailTemplatesApi {
  async create(templates: Array<Omit<CreateEmailTemplate, 'id'>>): Promise<EmailTemplate[]> {
    return authedApi.put(path, { json: { templates } }).json<EmailTemplate[]>();
  }

  async delete(id: string): Promise<void> {
    await authedApi.delete(`${path}/${id}`);
  }

  async findById(id: string): Promise<EmailTemplate> {
    return authedApi.get(`${path}/${id}`).json<EmailTemplate>();
  }

  async findAll(
    where?: Partial<Pick<EmailTemplate, 'languageTag' | 'templateType'>>
  ): Promise<EmailTemplate[]> {
    return authedApi.get(path, { searchParams: where }).json<EmailTemplate[]>();
  }

  async updateTemplateDetailsById(
    id: string,
    details: Partial<EmailTemplateDetails>
  ): Promise<EmailTemplate> {
    return authedApi.patch(`${path}/${id}/details`, { json: details }).json<EmailTemplate>();
  }

  async deleteMany(
    where: Partial<Pick<EmailTemplate, 'languageTag' | 'templateType'>>
  ): Promise<{ rowCount: number }> {
    return authedApi.delete(path, { searchParams: where }).json<{ rowCount: number }>();
  }
}
