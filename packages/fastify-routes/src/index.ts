
import { mkdirSync } from 'fs';

import fp from 'fastify-plugin';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { MLVision } from '@ekycsolutions/ml-vision';
import { ApiResult, EkycClient, EkycClientOptions } from '@ekycsolutions/client';

// import { mlApiRequestResponseSchema } from '../responses/ml_api_request';
import { ocrSchema, ocrHandler } from '../handlers/ocr';
import { faceCompareSchema, faceCompareHandler } from '../handlers/face_compare';
import { idDetectionSchema, idDetectionHandler } from '../handlers/id_detection';

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

export interface OnMlApiMetadata {
  apiName: string;
  apiVersion: string;
}

export interface FastifyLifecycleHookMlContext {
  apiResult: ApiResult;
  metadata: OnMlApiMetadata;
}

export interface FastifyLifecycleHookContext {
  done: any;
  req: FastifyRequest;
  reply: FastifyReply;
}

export interface EkycRoutesOpts {
  serverUrl: string;
  isServeUploadFiles?: boolean;
  fileStorageDriver: 's3' | 'local';
  onMlApiResult?: (mlApiResult: ApiResult, metadata: OnMlApiMetadata) => any;
  preMlRequest?: (fastifyContext: FastifyLifecycleHookContext, mlContext: FastifyLifecycleHookMlContext) => Promise<void>;
  postMlRequestBeforeSend?: (fastifyContext: FastifyLifecycleHookContext, mlContext: FastifyLifecycleHookMlContext) =>
    Promise<{ error: any; newPayload: any; }>;
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

  const apiMetadata = {
    'ocr': [{
      version: 0,
      versionName: 'v0',
    }],
    'face-compare': [{
      version: 0,
      versionName: 'v0',
    }],
    'id-detection': [{
      version: 0,
      versionName: 'v0',
    }]
  };

  const preHandler = async (req, reply, done) => {
    if (opts?.preMlRequest?.apply) {
      const apiName = req.url.split('/')[2];

      await opts.preMlRequest({ req, reply, done }, {
        apiResult: null,
        metadata: {
          apiName,
          apiVersion: apiMetadata[apiName][0].versionName,
        },
      });
    }
  };

  const preSerialization = async (req, reply, payload, done) => {
    if (opts?.postMlRequestBeforeSend?.apply) {
      const apiName = req.url.split('/')[2];

      const res = await opts.postMlRequestBeforeSend({ req, reply, done }, {
        apiResult: payload as any,
        metadata: {
          apiName,
          apiVersion: apiMetadata[apiName][0].versionName,
        },
      });

      if (res?.error) {
        throw res?.error;
      }

      return res?.newPayload ?? payload;
    }
  };

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

  fastify.route({
    url: '/v0/id-detection',
    method: ['POST'],
    schema: idDetectionSchema,
    preHandler,
    preSerialization,
    handler: async (request, reply) => idDetectionHandler(opts, request, reply),
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
