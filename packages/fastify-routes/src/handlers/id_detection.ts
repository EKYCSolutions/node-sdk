import { nanoid } from 'nanoid';
import { writeFileSync } from 'fs';
import { MLVision } from '@ekycsolutions/ml-vision';
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

export async function idDetectionHandler(opts, request, reply) {
    const mlVision: MLVision = (request as any).ekycMlVision;

    const body = request.body as any;

    const imageId = nanoid(32);

    if (opts.fileStorageDriver === 's3') {
    } else {
        writeFileSync(`/tmp/ekyc-uploads/${imageId}`, await body.image.toBuffer());
    }

    const result = await mlVision.idDetection({
        imageUrl: opts.fileStorageDriver === 's3'
            ? `${opts.s3.scheme}://s3.${opts.s3.region}.${opts.s3.host}/${opts.s3.bucket}/ekyc-uploads/${imageId}`
            : `${opts.serverUrl}/uploads/public/${imageId}`,
    });

    if (opts.onMlApiResult?.apply) {
        try {
            opts.onMlApiResult(result, { apiName: 'id-detection', apiVersion: 'v0' });
        } catch (err) {
            console.trace(err);
        }
    }

    reply.send(result);
};

