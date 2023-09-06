
import { FastifyInstance, FastifyRequest } from 'fastify';

import { Sqlite } from '../sqlite';

export const putMlReqArgs = async (_: FastifyInstance, req: FastifyRequest, mlReqArgs: any) => {
  const sqliteDb: Sqlite = (req as any).sqliteDb;

  await sqliteDb.runQueryRecord(
    `insert into ${sqliteDb.apiReqArgTable} (request_id, args) values (?, ?)`,
    [(req as any).reqId, JSON.stringify(mlReqArgs)]
  );
};

export const getMlReqArgs = async (req: any) => {
  const sqliteDb: Sqlite = (req as any).sqliteDb;

  const mlArgs: any = await sqliteDb.queryRecord(
    `select * from ${sqliteDb.apiReqArgTable} where request_id = ?`,
    [[(req as any).reqId]]
  );

  if (mlArgs) {
    return JSON.parse(mlArgs.args);
  }

  return null;
};
