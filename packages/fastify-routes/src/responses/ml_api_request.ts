export const mlApiRequestResponseSchema = {
    type: 'object',
    properties: {
        endTime: { type: 'string' },
        message: { type: 'string' },
        startTime: { type: 'string' },
        errorCode: { type: 'string' },
        isSuccess: { type: 'boolean' },
        timeElapsedAsSec: { type: 'number' },
        data: {
            type: 'object',
            additionalProperties: true,
            properties: { responseId: { type: 'string' } },
        },
    },
};