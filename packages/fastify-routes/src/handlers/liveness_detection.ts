import { nanoid } from 'nanoid';
import { writeFileSync } from 'fs';
import { Sqlite } from '../sqlite.js';
import { MLVision } from '@ekycsolutions/ml-vision';
import { mlApiRequestResponseSchema } from '../responses/ml_api_request.js'

export const livenessDetectionSchema = {
    response: {
        200: mlApiRequestResponseSchema,
    },
    consumes: ["multipart/form-data"],
    body: {
        type: 'object',
        required: ['videos', 'checks'],
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
            }
        }
    },
};

// todo"
// 1. query liveness config from sqlite default("yes", ["left", "right", blink])
// 2. check if liveness is enable 
//   - if disable liveness -> return error 
//   - else call api check liveness (livenessDetection.livenessDetection())
// body: ["left": video, "right": video, "blink": video]

export async function livenessDetectionHandler(opts, request, reply) {
    const sqliteDb: Sqlite = (request as any).sqliteDb;
    const livenessConfig = await sqliteDb.queryRecord(`SELECT enable FROM ${sqliteDb.livenessTable} LIMIT 1`);
    
    // @ts-ignore
    if (livenessConfig != null && livenessConfig.enable == 'no') {
        const errRsp = {
          message: "liveness not enable",
        };

        reply.code(422).send(errRsp); 
        return;
    }

    const mlVision: MLVision = (request as any).ekycMlVision;
    const body = request.body as any;
    const checks = body.checks;
    const videos = body.videos;

    const postBody = [];
    const videoId = nanoid(32);
    
    for (let index = 0; index < checks.length; index++) {
        let url = "";
        const check = checks[index];
        const video = videos[index];
        const fileName = `${videoId}.${check.value}.${index}`;

        if (opts.fileStorageDriver === 's3') {
            // post to s3 
            url = `${opts.s3.scheme}://s3.${opts.s3.region}.${opts.s3.host}/${opts.s3.bucket}/ekyc-uploads/${fileName}`;
        } else {
            writeFileSync(`/tmp/ekyc-uploads/${fileName}`, await video.toBuffer());

            url = `${opts.serverUrl}/uploads/public/${fileName}`;  
        }

        postBody.push({
            video_url: url,
            checks: check.value
        });
    }
    
    const result = await mlVision.livenessDetection({
        sequences: postBody
    });

    if (opts.onMlApiResult?.apply) {
        try {
            opts.onMlApiResult(result, { apiName: 'liveness-detection', apiVersion: 'v0' });
        } catch (err) {
            console.trace(err);
        }
    }

    reply.send(result);
};

