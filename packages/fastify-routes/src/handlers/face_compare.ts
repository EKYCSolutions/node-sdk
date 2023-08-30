
import { writeFileSync } from 'fs';

import { nanoid } from 'nanoid';

import { EkycRoutesOpts } from '../types.js';
import { MLVision } from '@ekycsolutions/ml-vision';
import { mlApiRequestResponseSchema } from '../responses/ml_api_request.js'

export const faceCompareSchema = {
    response: {
        200: mlApiRequestResponseSchema,
    },
    body: {
        type: 'object',
        required: ['faceImage0', 'faceImage1'],
        properties: {
            faceImage0: {
                $ref: '#multipartSchema',
            },
            faceImage1: {
                $ref: '#multipartSchema',
            },
        },
    },
};

export async function faceCompareHandler(request, reply) {
    const opts: EkycRoutesOpts = (request as any).ekycRoutesOpts;

    const mlVision: MLVision = (request as any).ekycMlVision;

    const body = request.body as any;

    const imageId = nanoid(32);

    if (opts.fileStorageDriver === 's3') {
    } else {
        writeFileSync(`/tmp/ekyc-uploads/${imageId}.0`, await body.faceImage0.toBuffer());
        writeFileSync(`/tmp/ekyc-uploads/${imageId}.1`, await body.faceImage1.toBuffer());
    }

    const result = await mlVision.faceCompare({
        faceImage0Url: opts.fileStorageDriver === 's3'
            ? `${opts.s3.scheme}://s3.${opts.s3.region}.${opts.s3.host}/${opts.s3.bucket}/ekyc-uploads/${imageId}.0`
            : `${opts.serverUrl}/uploads/public/${imageId}.0`,
        faceImage1Url: opts.fileStorageDriver === 's3'
            ? `${opts.s3.scheme}://s3.${opts.s3.region}.${opts.s3.host}/${opts.s3.bucket}/ekyc-uploads/${imageId}.1`
            : `${opts.serverUrl}/uploads/public/${imageId}.1`,
    });

    reply.send(result);
};

