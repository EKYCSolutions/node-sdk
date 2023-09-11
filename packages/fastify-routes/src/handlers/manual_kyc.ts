
import { writeFileSync } from 'fs';

import { nanoid } from 'nanoid';

import { EkycRoutesOpts } from '../types.js';
import { putMlReqArgs } from '../utils/context.js';
import { mlApiRequestResponseSchema } from '../responses/ml_api_request.js'
import { MLVision, ManualKycParams, OcrObjectType } from '@ekycsolutions/ml-vision';

export const manualKycSchema = {
    response: {
        200: mlApiRequestResponseSchema,
    },
    consumes: ["multipart/form-data"],
    body: {
        type: 'object',
        required: ['faceImage', 'ocrImage', 'faceLeftImage', 'faceRightImage', 'objectType'],
        properties: {
            faceImage: {
                $ref: '#multipartSchema',
            },
            ocrImage: {
                $ref: '#multipartSchema',
            },
            faceLeftImage: {
                $ref: '#multipartSchema',
            },
            faceRightImage: {
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
        }
    },
};

async function map_file_upload(opts, fileName, file): Promise<string> {

    if (opts.fileStorageDriver === 's3') {
        // url = `${opts.s3.scheme}://s3.${opts.s3.region}.${opts.s3.host}/${opts.s3.bucket}/ekyc-uploads/${fileName}`;
    } else {
        writeFileSync(`/tmp/ekyc-uploads/${fileName}`, await file.toBuffer());
    }

    return opts.fileStorageDriver === 's3'
        ? `${opts.s3.scheme}://s3.${opts.s3.region}.${opts.s3.host}/${opts.s3.bucket}/ekyc-uploads/${fileName}`
        : `${opts.serverUrl}/uploads/public/${fileName}`;
}

export async function manualKycHandler(request, _reply) {
    const mlVision: MLVision = (request as any).ekycMlVision;
    const opts: EkycRoutesOpts = (request as any).ekycRoutesOpts;
    const body = request.body as any;

    const fileId = nanoid(32);

    const requestBody: ManualKycParams = {
        isRaw: body?.isRaw?.value ?? 'yes',
        objectType: body.objectType.value,
        ocrImageUrl: await map_file_upload(opts, `${fileId}.ocr`, body.ocrImage),
        faceImageUrl: await map_file_upload(opts, `${fileId}.face`, body.faceImage),
        faceTurnLeftImageUrl: await map_file_upload(opts, `${fileId}.faceTurnLeftImage`, body.faceLeftImage),
        faceTurnRightImageUrl: await map_file_upload(opts, `${fileId}.faceTurnRightImage`, body.faceRightImage),
    };

    const [result, _] = await Promise.all([mlVision.manualKyc(requestBody), putMlReqArgs(this, request, requestBody)]);

    return result;
};
