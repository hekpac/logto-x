import { sql } from '@silverhand/slonik';

/* eslint-disable @typescript-eslint/no-unsafe-call */

import type { AlterationScript } from '../lib/types/alteration.js';

const alteration: AlterationScript = {
  up: async (pool) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await pool.query(sql`
      alter table users
        add column unverified_emails jsonb not null default '[]'::jsonb;
    `);
  },
  down: async (pool) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await pool.query(sql`
      alter table users
        drop column unverified_emails;
    `);
  },
};

export default alteration;

/* eslint-enable @typescript-eslint/no-unsafe-call */
