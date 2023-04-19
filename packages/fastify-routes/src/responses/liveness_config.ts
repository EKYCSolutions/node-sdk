export const livenessConfigResponseSchema = {
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