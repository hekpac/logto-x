import { type VerificationIdentifier, type User } from '@logto/schemas';
import type Queries from '#src/tenants/Queries.js';
import RequestError from '#src/errors/RequestError/index.js';
import assertThat from '#src/utils/assert-that.js';

import { findUserByIdentifier } from '../../utils.js';

export const identifyUserByIdentifier = async (
  queries: Queries,
  verified: boolean,
  identifier: VerificationIdentifier
): Promise<User> => {
  assertThat(
    verified,
    new RequestError({ code: 'session.verification_failed', status: 400 })
  );

  const user = await findUserByIdentifier(queries.users, identifier);

  assertThat(
    user,
    new RequestError(
      { code: 'user.user_not_exist', status: 404 },
      { identifier: identifier.value }
    )
  );

  return user;
};
