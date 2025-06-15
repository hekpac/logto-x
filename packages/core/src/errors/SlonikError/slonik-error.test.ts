import { DatabaseError } from './index.js';

import { DeletionError } from './index.js';

describe('SlonikError', () => {
  it('DeletionError', () => {
    const error = new DeletionError('user', 'foo');
    expect(error instanceof DatabaseError).toEqual(true);
    expect(error.table).toEqual('user');
    expect(error.id).toEqual('foo');
  });
});
