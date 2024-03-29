
import { FastifyReply, FastifyRequest } from 'fastify';

import { Sqlite } from '../sqlite.js';

export const tokenGuard = async (request: FastifyRequest, reply: FastifyReply) => {
  if (process.env.IS_ENABLE_TOKEN_GUARD === 'yes') {
    if (request.headers.authorization) {
      const sqliteDb: Sqlite = (request as any).sqliteDb;

      const token = request.headers.authorization.replace('Bearer ', '');

      if (await sqliteDb.queryRecord(`select 1 from ${sqliteDb.apiTokenTable} where token = ?`, [token])) {
        return;
      }
    }

    reply.code(403);

    throw new Error('unauthorized');
  } 
};
