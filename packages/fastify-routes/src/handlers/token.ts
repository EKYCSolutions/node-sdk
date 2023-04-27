
import { nanoid } from 'nanoid';
import { Sqlite } from '../sqlite.js';

import { tokenCreateResponseSchema } from '../responses/token_create_response.js';

export const tokenCreateSchema = {
  response: {
    200: tokenCreateResponseSchema,
  },
};

export async function tokenCreateHandler(opts, request, reply) {
  const sqliteDb: Sqlite = (request as any).sqliteDb;

  const token = nanoid(256);

  await sqliteDb.runQueryRecord(
    `INSERT INTO ${sqliteDb.apiTokenTable} values (?)`,
    [token]
  );

  reply.send(token);
}
