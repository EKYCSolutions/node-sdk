import { Sqlite } from '../sqlite.js';
import { manualKycConfigResponseSchema } from '../responses/manual_kyc_config.js';

export const manualKycUpdateSchema = {
    response: {
        200: manualKycConfigResponseSchema,
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

export async function manualKycQueryHandler(request, reply) {
    const sqliteDb: Sqlite = (request as any).sqliteDb;
    const result = await sqliteDb.queryRecord(`SELECT enable FROM ${sqliteDb.kycConfigTable} LIMIT 1`);

    reply.send(result);
};

export async function manualKycUpdateHandler(request, reply) {
    const sqliteDb: Sqlite = (request as any).sqliteDb;
    const body = request.body as any;
    
    await sqliteDb.runQueryRecord(
        `UPDATE ${sqliteDb.kycConfigTable} SET enable = ?`, 
        [body.enable]
    );
   
    const result = await sqliteDb.queryRecord(`SELECT enable FROM ${sqliteDb.kycConfigTable} LIMIT 1`);

    reply.send(result);
};

