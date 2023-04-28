export const manualKycConfigResponseSchema = {
    type: 'object',
    properties: {
        properties: {
            enable: {
                type: "string",
                enum: ["yes", "no"]
            } 
        }
    },
};