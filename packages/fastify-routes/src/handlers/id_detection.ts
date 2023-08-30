
import { writeFileSync } from 'fs';

import { nanoid } from 'nanoid';

import { EkycRoutesOpts } from '../types.js';
import { MLVision } from '@ekycsolutions/ml-vision';
import { putMlReqArgs } from '../utils/fastify-context.js';
import { mlApiRequestResponseSchema } from '../responses/ml_api_request.js'

export const idDetectionSchema = {
    response: {
        200: mlApiRequestResponseSchema,
    },
    body: {
        type: 'object',
        required: ['image'],
        properties: {
            image: {
                $ref: '#multipartSchema',
            },
        },
    },
};

export async function idDetectionHandler(request, reply) {
    const opts: EkycRoutesOpts = (request as any).ekycRoutesOpts;

    const mlVision: MLVision = (request as any).ekycMlVision;

    const body = request.body as any;

    const imageId = nanoid(32);

    if (opts.fileStorageDriver === 's3') {
    } else {
        writeFileSync(`/tmp/ekyc-uploads/${imageId}`, await body.image.toBuffer());
    }

    const requestBody = {
        imageUrl: opts.fileStorageDriver === 's3'
            ? `${opts.s3.scheme}://s3.${opts.s3.region}.${opts.s3.host}/${opts.s3.bucket}/ekyc-uploads/${imageId}`
            : `${opts.serverUrl}/uploads/public/${imageId}`,
    };

    const result = await mlVision.idDetection(requestBody);

    putMlReqArgs(this, request, requestBody);

    reply.send(result);
};

