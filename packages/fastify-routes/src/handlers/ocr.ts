import { nanoid } from 'nanoid';
import { writeFileSync } from 'fs';
import { MLVision, OcrObjectType } from '@ekycsolutions/ml-vision';
import { mlApiRequestResponseSchema } from '../responses/ml_api_request.js'

export const ocrSchema = {
    response: {
        200: mlApiRequestResponseSchema,
    },
    body: {
        type: 'object',
        required: ['image', 'objectType'],
        properties: {
            image: {
                $ref: '#multipartSchema',
            },
            isRaw: {
                type: 'object',
                properties: {
                    value: {
                        type: 'string',
                        enum: ['no', 'yes'],
                    },
                },
            },
            objectType: {
                type: 'object',
                properties: {
                    value: {
                        type: 'string',
                        enum: Object.values(OcrObjectType),
                    },
                },
            },
        },
    },
};

export async function ocrHandler(opts, request, reply) {
    const mlVision: MLVision = (request as any).ekycMlVision;

    const body = request.body as any;

    const imageId = nanoid(32);

    if (opts.fileStorageDriver === 's3') {
    } else {
        writeFileSync(`/tmp/ekyc-uploads/${imageId}`, await body.image.toBuffer());
    }

    const result = await mlVision.ocr({
        objectType: body.objectType.value,
        isRaw: body?.isRaw?.value ?? 'yes',
        imageUrl: opts.fileStorageDriver === 's3'
            ? `${opts.s3.scheme}://s3.${opts.s3.region}.${opts.s3.host}/${opts.s3.bucket}/ekyc-uploads/${imageId}`
            : `${opts.serverUrl}/uploads/public/${imageId}`,
    });

    try {
        opts.onMlApiResult(result, { apiName: 'ocr', apiVersion: 'v0' });
    } catch (err) {
        console.trace(err);
    }

    reply.send(result);
};

