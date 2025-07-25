import type { SchemaLike, GeneratedSchema } from '@logto/schemas';
import type { UpdateWhereData } from '@logto/shared';
// Base error class for database operations
export class DatabaseError extends Error {}

import { type OmitAutoSetFields } from '#src/utils/sql.js';

export class DeletionError extends DatabaseError {
  public constructor(
    public readonly table?: string,
    public readonly id?: string
  ) {
    super('Resource not found.');
  }
}

export class UpdateError<
  Key extends string,
  CreateSchema extends Partial<SchemaLike<Key>>,
  Schema extends SchemaLike<Key>,
  SetKey extends Key,
  WhereKey extends Key,
> extends DatabaseError {
  public constructor(
    public readonly schema: GeneratedSchema<Key, CreateSchema, Schema>,
    public readonly detail: Partial<UpdateWhereData<SetKey, WhereKey>>
  ) {
    super('Resource not found.');
  }
}

export class InsertionError<
  Key extends string,
  CreateSchema extends Partial<SchemaLike<Key>>,
  Schema extends SchemaLike<Key>,
> extends DatabaseError {
  public constructor(
    public readonly schema: GeneratedSchema<Key, CreateSchema, Schema>,
    public readonly detail?: OmitAutoSetFields<CreateSchema>
  ) {
    super('Create Error.');
  }
}
