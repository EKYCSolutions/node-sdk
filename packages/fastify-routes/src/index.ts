
import { mkdirSync } from 'fs';

import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';

import { MLVision } from '@ekycsolutions/ml-vision';
import { ApiResult, EkycClient, EkycClientOptions } from '@ekycsolutions/client';

import { ocrSchema, ocrHandler } from '../handlers/ocr'
import { faceCompareSchema, faceCompareHandler } from '../handlers/face_compare'

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
    schema: ocrSchema,
    handler: async (request, reply) => ocrHandler(opts, request, reply),
  });

  fastify.route({
    url: '/v0/face-compare',
    method: ['POST'],
    schema: faceCompareSchema,
    handler: async (request, reply) => faceCompareHandler(opts, request, reply),
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
