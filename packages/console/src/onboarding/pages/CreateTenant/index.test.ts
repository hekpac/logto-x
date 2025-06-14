import { parseCollaboratorEmailOptions } from './index';

const translate = (key: string) => key;

describe('parseCollaboratorEmailOptions', () => {
  it('should return values when all emails are valid and unique', () => {
    const values = [
      { id: '1', value: 'a@example.com' },
      { id: '2', value: 'b@example.com' },
    ];
    expect(parseCollaboratorEmailOptions(values, translate)).toEqual({ values });
  });

  it('should mark invalid emails and return error message', () => {
    const values = [
      { id: '1', value: 'invalid' },
      { id: '2', value: 'b@example.com' },
    ];
    const result = parseCollaboratorEmailOptions(values, translate);
    expect(result.values[0].status).toBe('error');
    expect(result.errorMessage).toBe('tenant_members.errors.invalid_email');
  });

  it('should detect duplicate emails and return error message', () => {
    const values = [
      { id: '1', value: 'a@example.com' },
      { id: '2', value: 'A@example.com' },
    ];
    const result = parseCollaboratorEmailOptions(values, translate);
    expect(result.values[0].status).toBe('error');
    expect(result.values[1].status).toBe('error');
    expect(result.errorMessage).toBe('tenant_members.errors.email_exists');
  });
});
