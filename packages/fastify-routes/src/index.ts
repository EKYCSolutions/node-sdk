
import { mkdirSync, writeFileSync } from 'fs';

import fp from 'fastify-plugin';
import { nanoid } from 'nanoid';
import { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';

import { MLVision, OcrObjectType } from '@ekycsolutions/ml-vision';
import { ApiResult, EkycClient, EkycClientOptions } from '@ekycsolutions/client';

export const ekycPlugin = fp(async (fastify: FastifyInstance, opts: EkycClientOptions, next) => {
  const ekycClient = new EkycClient(opts);

  const mlVision = new MLVision(ekycClient);

  fastify.decorate('ekycClient', ekycClient);
  fastify.decorate('ekycMlVision', mlVision);

  fastify.addHook('preHandler', (req: any, _, next) => {
    req.ekycClient = ekycClient;
    req.ekycMlVision = mlVision;
    next();
  });

  next();
}, {
  fastify: '4.x',
  name: '@ekycsolutions/fastify-ekyc',
});

const mlApiRequestResponseSchema = {
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

export interface OnMlApiResultMetadata {
  apiName: string;
  apiVersion: string;
}

export interface EkycRoutesOpts {
  serverUrl: string;
  isServeUploadFiles?: boolean;
  fileStorageDriver: 's3' | 'local';
  onMlApiResult?: (mlApiResult: ApiResult, metadata: OnMlApiResultMetadata) => any;
  s3?: {
    host: string;
    port: number;
    scheme: string;
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export const ekycRoutes = fp(async (fastify: FastifyInstance, opts: EkycRoutesOpts, next) => { 
  mkdirSync('/tmp/ekyc-uploads', { recursive: true });

  fastify.route({
    url: '/v0/ocr',
    method: ['POST'],
    schema: {
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
    },
    handler: async (request, reply) => {
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
    },
  });

  fastify.route({
    url: '/v0/face-compare',
    method: ['POST'],
    schema: {
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
    },
    handler: async (request, reply) => {
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

      if (opts.onMlApiResult?.apply) {
        try {
          opts.onMlApiResult(result, { apiName: 'face-compare', apiVersion: 'v0' });
        } catch (err) {
          console.trace(err);
        }
      }

      reply.send(result);
    },
  });

  next();
}, {
  fastify: '4.x',
  name: '@ekycsolutions/fastify-routes',
  dependencies: ['@fastify/multipart', '@ekycsolutions/fastify-ekyc'],
});

export const ekycRoutesPlugin = fp(async (
  fastify: FastifyInstance,
  opts: {
    ekycPluginArgs: EkycClientOptions;
    ekycRoutesPluginArgs: EkycRoutesOpts;
  }
) => {
  fastify.register(fastifyMultipart, {
    attachFieldsToBody: true,
    sharedSchemaId: '#multipartSchema',
  });

  if (
    opts.ekycRoutesPluginArgs.fileStorageDriver !== 's3' &&
    (opts.ekycRoutesPluginArgs?.isServeUploadFiles ?? true)
  ) {
    fastify.register(fastifyStatic, {
      root: '/tmp/ekyc-uploads',
      prefix: '/uploads/public/',
    });
  } 

  fastify.register(ekycPlugin, opts.ekycPluginArgs);

  fastify.register(ekycRoutes, opts.ekycRoutesPluginArgs);
});
