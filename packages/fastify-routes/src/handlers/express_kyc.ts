
import { writeFileSync } from 'fs';

import { nanoid } from 'nanoid';

import { Sqlite } from '../sqlite.js';
import { EkycRoutesOpts } from '../types.js';
import { putMlReqArgs } from '../utils/context.js';
import { mlApiRequestResponseSchema } from '../responses/ml_api_request.js'
import { ExpressKycParams, MLVision, OcrObjectType } from '@ekycsolutions/ml-vision';

export const expressKycSchema = {
    response: {
        200: mlApiRequestResponseSchema,
    },
    consumes: ["multipart/form-data"],
    body: {
        type: 'object',
        required: ['faceImage', 'ocrImage', 'objectType'],
        properties: {
            videos: {
                type: 'array',
                items: {
                    $ref: '#multipartSchema',
                }
            },
            checks: {
                type: 'array',
                items: {
                    required: ['value'],
                    properties: {
                        value: {
                            type: 'string',
                            enum: ['left', 'right', 'blink']
                        }
                    }
                }
            },
            faceImage: {
                $ref: '#multipartSchema',
            },
            ocrImage: {
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

export async function expressKycHandler(request, reply) {
    const sqliteDb: Sqlite = (request as any).sqliteDb;
    const mlVision: MLVision = (request as any).ekycMlVision;
    const opts: EkycRoutesOpts = (request as any).ekycRoutesOpts;
    const body = request.body as any;
    const checks = body.checks;
    const videos = body.videos;

    const fileId = nanoid(32);

    const requestBody: ExpressKycParams = {
        sequences: [],
        faceImageUrl: await map_file_upload(opts, `${fileId}.face`, body.faceImage),
        ocrImageUrl: await map_file_upload(opts, `${fileId}.ocr`, body.ocrImage),
        isRaw: body?.isRaw?.value ?? 'yes',
        objectType: body.objectType.value
    };

    if (checks != null && videos != null) {
        // run livenessDetection

        const sequences = [];
        const livenessConfig = await sqliteDb.queryRecord(`SELECT enable FROM ${sqliteDb.livenessTable} LIMIT 1`);

        // @ts-ignore
        if (livenessConfig != null && livenessConfig.enable == 'no') {
            const errRsp = {
                message: "Liveness detection not enable",
            };

            reply.code(422).send(errRsp);
            return;
        }

        for (let index = 0; index < checks.length; index++) {
            const check = checks[index].value;

            sequences.push({
                video_url: await map_file_upload(opts, `${fileId}.${check}.${index}`, videos[index]),
                checks: check
            });
        }

        requestBody.sequences = sequences;
    }
    else {
        // check for enable config of manual kyc
        const kycConfig = await sqliteDb.queryRecord(`SELECT enable FROM ${sqliteDb.kycConfigTable} LIMIT 1`);

        // @ts-ignore
        if (kycConfig != null && kycConfig.enable == 'no') {
            const errRsp = {
                message: "express kyc check kyc not enable",
            };

            reply.code(422).send(errRsp);
            return;
        }
    }

    const [result, _] = await Promise.all([mlVision.expressKyc(requestBody), putMlReqArgs(this, request, requestBody)]);

    return result;
};
