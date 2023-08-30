
import { nanoid } from 'nanoid';
import { FastifyRequest } from 'fastify';

import { Sqlite } from '../sqlite.js';
import { tokenCreateResponseSchema } from '../responses/token_create_response.js';

export const tokenCreateSchema = {
  response: {
    200: tokenCreateResponseSchema,
  },
};

export async function tokenCreateHandler(request: FastifyRequest, reply) {
  const sqliteDb: Sqlite = (request as any).sqliteDb;

  const token = nanoid(256);

  await sqliteDb.runQueryRecord(
    `INSERT INTO ${sqliteDb.apiTokenTable} values (?)`,
    [token]
  );

  reply.send(token);
}

export async function tokenDeleteHandler(request: FastifyRequest, reply) {
  const sqliteDb: Sqlite = (request as any).sqliteDb;

  await sqliteDb.runQueryRecord(`delete from ${sqliteDb.apiTokenTable} where token = ?`, [(request.body as any).token.value]);

  reply.send('');
}
