
import { mkdirSync, writeFileSync } from 'fs';

import fp from 'fastify-plugin';
import { nanoid } from 'nanoid';
import { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';

import { MLVision, OcrObjectType } from '@ekycsolutions/ml-vision';
import { EkycClient, EkycClientOptions } from '@ekycsolutions/client';

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

export const ekycRoutes = fp(async (fastify: FastifyInstance, opts, next) => { 
  mkdirSync('/tmp/ekyc-uploads', { recursive: true });

  fastify.route({
    url: '/v0/ocr',
    method: ['POST'],
    schema: {
      response: {
        200: {
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
        },
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
          ? `${opts.s3Url}/ekyc-uploads/${imageId}`
          : `${opts.serverUrl}/uploads/public/${imageId}`,
      });

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
    ekycRoutesPluginArgs: {
      serverUrl: string;
      isServeUploadFiles?: boolean;
      fileStorageDriver: 's3' | 'local';
    };
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
