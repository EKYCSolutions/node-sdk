import { Sqlite } from '../sqlite.js';
import { livenessConfigResponseSchema } from '../responses/liveness_config.js';

export const livenessUpdateSchema = {
    response: {
        200: livenessConfigResponseSchema,
    },
    body: {
        type: 'object',
        // required: ['enable'],
        properties: {
            enable: {
                type: 'string',
                enum: ['yes', 'no']
            }
        },
    },
};

export async function livenessQueryHandler(request, reply) {
    const sqliteDb: Sqlite = (request as any).sqliteDb;
    const result = await sqliteDb.queryRecord(`SELECT enable FROM ${sqliteDb.livenessTable} LIMIT 1`);

    reply.send(result);
};

export async function livenessUpdateHandler(request, reply) {
    const sqliteDb: Sqlite = (request as any).sqliteDb;
    const body = request.body as any;
    
    await sqliteDb.runQueryRecord(
        `UPDATE ${sqliteDb.livenessTable} SET enable = ?`, 
        [body.enable]
    );
   
    const result = await sqliteDb.queryRecord(`SELECT enable FROM ${sqliteDb.livenessTable} LIMIT 1`);

    reply.send(result);
};

