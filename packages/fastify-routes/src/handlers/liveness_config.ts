import { Sqlite } from '../sqlite.js';
import { livenessConfigResponseSchema } from '../responses/liveness_config.js';

export const livenessGetConfigSchema = {
    querystring: {
        checkStepCount: {
            type: 'number'
        },
        idempotentId: {
            type: 'string'
        }
    },
};

export const livenessUpdateSchema = {
    response: {
        200: livenessConfigResponseSchema,
    },
    body: {
        type: 'object',
        required: ['checks'],
        properties: {
            enable: {
                type: 'string',
                enum: ['yes', 'no']
            },
            checks: {
                type: 'array',
                items: {
                    type: 'string',
                    enum: ['left', 'right', 'blink']
                }
            }
        },
    },
};

function validateMaxSteps(min, max, number) {
    return number > max ? max : (number < min ? min : number);
}

function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    while (currentIndex != 0) {

        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}

export async function livenessQueryHandler(opts, request, reply) {
    const minLivenessCheckSteps = 2;
    const maxLivenessCheckSteps = 8;
    const sqliteDb: Sqlite = (request as any).sqliteDb;
    const query = request.query as any;
    let result = await sqliteDb.queryRecord(`SELECT enable FROM ${sqliteDb.livenessTable} LIMIT 1`);
    let livenessChecks = await sqliteDb.queryRecord(`SELECT checks FROM ${sqliteDb.livenessChecksTable} LIMIT 1`);

    const idempotentId = query.idempotentId;
    let checkStepCount = query.checkStepCount;

    if (livenessChecks != null) {
        let checks = livenessChecks['checks'].split(',');

        if (checkStepCount != null) {
            const validatedStepCount = validateMaxSteps(minLivenessCheckSteps, maxLivenessCheckSteps, parseInt(checkStepCount));

            if (checks.length != validatedStepCount) {
                let arr = [];

                if (checks.length > validatedStepCount) {
                    for (let index = 0; index < validatedStepCount; index++) {
                        arr.push(checks[Math.floor(Math.random() * checks.length)]);
                    }
                }
                else {
                    for (let index = 0; index < validatedStepCount; index++) {

                        // if index value more than size of array, do modulo
                        const i = (index < checks.length) ? index : index % checks.length;
                        arr.push(checks[i]);
                    }
                }

                checks = arr;
            }
        }

        // store ekyc checks using idempotentId here

        result['checks'] = shuffle(checks);
        result['checkSteps'] = checks.length;
        result['idempotentId'] = idempotentId;
    }

    reply.send(result);
};

export async function livenessUpdateHandler(opts, request, reply) {
    const sqliteDb: Sqlite = (request as any).sqliteDb;
    const body = request.body as any;

    await sqliteDb.runQueryRecord(
        `UPDATE ${sqliteDb.livenessTable} SET enable = ?`,
        [body.enable]
    );

    let checks = body.checks;
    if (checks != null && checks.length > 0) {
        checks = checks.join(",");

        await sqliteDb.runQueryRecord(
            `UPDATE ${sqliteDb.livenessChecksTable} SET checks = ?`,
            [checks]
        );
    }

    const result = await sqliteDb.queryRecord(`SELECT enable FROM ${sqliteDb.livenessTable} LIMIT 1`);

    reply.send(result);
};

