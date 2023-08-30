
import { ApiResult } from '@ekycsolutions/client';
import { FastifyReply, FastifyRequest } from 'fastify';

export interface EkycRoutesOpts {
  serverUrl: string;
  isServeUploadFiles?: boolean;
  fileStorageDriver: 's3' | 'local';
  onMlApiResult?: (mlApiResult: ApiResult, metadata: OnMlApiMetadata) => Promise<void>;
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

export interface OnMlApiMetadata {
  apiName: string;
  apiVersion: string;
}

export interface FastifyLifecycleHookMlContext {
  apiResult: ApiResult;
  metadata: OnMlApiMetadata;
}

export interface FastifyLifecycleHookContext {
  req: FastifyRequest;
  reply: FastifyReply;
}
