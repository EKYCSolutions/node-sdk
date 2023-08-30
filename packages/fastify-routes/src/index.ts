
import { mkdirSync } from 'fs';

import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import { MLVision } from '@ekycsolutions/ml-vision';
import { EkycClient, EkycClientOptions } from '@ekycsolutions/client';

import { Sqlite } from './sqlite.js';
import { EkycRoutesOpts } from './types.js';
import { apiMetadata } from './api-metadata.js';
import { ocrSchema, ocrHandler } from './handlers/ocr.js';
import { Middleware, middlewares } from './middlewares/index.js';
import { manualKycHandler, manualKycSchema } from './handlers/manual_kyc.js';
import { faceCompareSchema, faceCompareHandler } from './handlers/face_compare.js';
import { idDetectionSchema, idDetectionHandler } from './handlers/id_detection.js';
import { tokenCreateHandler, tokenCreateSchema, tokenDeleteHandler } from './handlers/token.js';
import { livenessDetectionHandler, livenessDetectionSchema } from './handlers/liveness_detection.js';
import { livenessQueryHandler, livenessUpdateHandler, livenessUpdateSchema } from './handlers/liveness_config.js';
import { manualKycQueryHandler, manualKycUpdateHandler, manualKycUpdateSchema } from './handlers/manual_kyc_config.js';

export const ekycPlugin = fp(async (fastify: FastifyInstance, opts: EkycClientOptions, next) => {
  const sqlitePath = process.env.sqlitePath ?? '/tmp/ekyc_db';
  
  const sqliteDb = new Sqlite(sqlitePath);
  const ekycClient = new EkycClient(opts);
  const mlVision = new MLVision(ekycClient);

  fastify.decorate('sqliteDb', sqliteDb);
  fastify.decorate('ekycClient', ekycClient);
  fastify.decorate('ekycMlVision', mlVision);

  fastify.addHook('preHandler', (req: any, _, next) => {
    req.sqliteDb = sqliteDb;
    req.ekycClient = ekycClient;
    req.ekycMlVision = mlVision;
    next();
  });

  next();
}, {
  fastify: '4.x',
  name: '@ekycsolutions/fastify-ekyc',
});

export const ekycRoutes = fp(async (fastify: FastifyInstance, opts: EkycRoutesOpts, next) => {
  mkdirSync('/tmp/ekyc-uploads', { recursive: true }); 

  fastify.decorate('ekycRoutesOpts', opts);

  fastify.addHook('preHandler', (req: any, _, next) => {
    req.ekycRoutesOpts = opts;
    next();
  });

  const applyMiddies = (middies: Middleware[]) => async (req, reply) => {
    for (const middie in middies) {
      await middlewares[middies[middie]](req, reply);
    }
  };

  const preSerialization = async (req, reply, payload, done) => {
    if (opts?.onMlApiResult?.apply) {
      const apiName = req.url.split('/')[2];

      await opts.onMlApiResult(
        payload as any,
        {
          apiName,
          apiVersion: apiMetadata[apiName][0].versionName,
        }
      );
    }

    if (opts?.postMlRequestBeforeSend?.apply) {
      const apiName = req.url.split('/')[2];

      const res = await opts.postMlRequestBeforeSend({ req, reply }, {
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
    url: '/v0/token',
    method: ['POST'],
    schema: tokenCreateSchema,
    handler: tokenCreateHandler,
    preHandler: applyMiddies([Middleware.adminApiKeyGuard]),
  });
  
  fastify.route({
    url: '/v0/token',
    method: ['DELETE'],
    handler: tokenDeleteHandler,
    preHandler: applyMiddies([Middleware.adminApiKeyGuard]),
  });

  fastify.route({
    url: '/v0/ocr',
    method: ['POST'],
    schema: ocrSchema,
    preSerialization,
    handler: ocrHandler,
    preHandler: applyMiddies([Middleware.tokenGuard, Middleware.preMlRequest]),
  });

  fastify.route({
    url: '/v0/face-compare',
    method: ['POST'],
    schema: faceCompareSchema,
    preSerialization,
    handler: faceCompareHandler,
    preHandler: applyMiddies([Middleware.tokenGuard, Middleware.preMlRequest]),
  });

  fastify.route({
    url: '/v0/id-detection',
    method: ['POST'],
    schema: idDetectionSchema,
    preSerialization,
    handler: idDetectionHandler,
    preHandler: applyMiddies([Middleware.tokenGuard, Middleware.preMlRequest]),
  });
  
  fastify.route({
    url: '/v0/liveness-detection',
    method: ['POST'],
    schema: livenessDetectionSchema,
    preSerialization,
    handler: livenessDetectionHandler,
    preHandler: applyMiddies([Middleware.tokenGuard, Middleware.preMlRequest]),
  });

  fastify.route({
    url: '/v0/liveness-config',
    method: ['POST'],
    schema: livenessUpdateSchema,
    preSerialization,
    handler: livenessUpdateHandler,
    preHandler: applyMiddies([Middleware.adminApiKeyGuard]),
  });

  fastify.route({
    url: '/v0/liveness-config',
    method: ['GET'],
    preSerialization,
    handler: livenessQueryHandler,
  });

  fastify.route({
    url: '/v0/manual-kyc-config',
    method: ['POST'],
    schema: manualKycUpdateSchema,
    preSerialization,
    handler: manualKycUpdateHandler,
    preHandler: applyMiddies([Middleware.adminApiKeyGuard]),
  });

  fastify.route({
    url: '/v0/manual-kyc-config',
    method: ['GET'],
    preSerialization,
    handler: manualKycQueryHandler,
  });

  fastify.route({
    url: '/v0/manual-kyc',
    method: ['POST'],
    schema: manualKycSchema,
    preSerialization,
    handler: manualKycHandler,
    preHandler: applyMiddies([Middleware.tokenGuard, Middleware.preMlRequest]),
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
  if (process.env.IS_ENABLE_CORS === 'yes') {
    fastify.register(cors, {
      credentials: false,
      origin: process.env.CORS_ORIGINS.split(','),
      methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    });
  }

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
