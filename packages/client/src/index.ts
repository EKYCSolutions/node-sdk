
import { randomUUID } from 'crypto';
import { writeFileSync, mkdirSync } from 'fs';

import FormData from 'form-data';
import got, { Options, OptionsInit } from 'got';
import { Auth, AuthOptions } from '@ekycsolutions/auth';

import { EkycClientErrorCode } from './error-code.js';

export interface EkycClientOptions {
  auth: AuthOptions;
  serverAddress?: string;
  maxRequestTimeoutAsSec?: number;
}

export interface PrepareFormDataMeta {
  api: string;
  version: string;
}

export interface ApiResultResponse {
  result: any;
  error: {
    code: string;
    message: string;
  };
  service_usage: {
    id: string;
    end_time: string;
    start_time: string;
    inserted_at: string;
    is_success: boolean;
  };
}

export interface ApiResult {
  data: any;
  message: string;
  errorCode: string;
  isSuccess: boolean;
  endTime: string;
  startTime: string;
  timeElapsedAsSec: number;
}

export class EkycClient {
  private readonly auth: Auth;
  readonly serverAddress: string;
  readonly maxRequestTimeoutAsSec: number;

  constructor({ auth, serverAddress, maxRequestTimeoutAsSec }: Readonly<EkycClientOptions>) {
    this.auth = new Auth(auth);
    this.maxRequestTimeoutAsSec = maxRequestTimeoutAsSec ?? 64;
    this.serverAddress = serverAddress ?? 'https://server.ews.sandbox.ekycsolutions.com';
  }

  public async getRequestOpts(): Promise<OptionsInit> {
    const authRequestOpts = await this.auth.getRequestOpts();

    return {
      http2: true,
      isStream: false,
      responseType: 'json',
      prefixUrl: this.serverAddress,
      https: { ...authRequestOpts, minVersion: 'TLSv1.3', rejectUnauthorized: true },
    };
  }

  public prepareFormData(meta: PrepareFormDataMeta): FormData {
    const formData = new FormData();

    const idempotentId = randomUUID();

    mkdirSync('/tmp/request-ids', { recursive: true });

    writeFileSync(
      `/tmp/request-ids/${idempotentId}`,
      JSON.stringify({ ...meta, idempotentId, preparedAt: new Date() }, undefined, 2),
      { mode: '0440' }
    );

    formData.append('idempotent_id', idempotentId);

    return formData;
  }

  public async makeRequest(endpoint: string, options: Options): Promise<ApiResult> {
    const connectionOpts = await this.getRequestOpts();

    options.merge(connectionOpts);

    const mlRequestResult = await got(endpoint, { ...options }).json<{ id: string; }>();

    if (mlRequestResult?.id) {
      return await this.apiResultPolling(mlRequestResult.id);
    }

    return null;
  }

  sleep(timeAsSec: number) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(true);
      }, timeAsSec * 1000);
    });
  }

  public async apiResultPolling(responseId: string): Promise<ApiResult> {
    let retryCount = 0;

    while (true) {
      try {
        const res =
          await got(
            `v0/api-request-reply/${responseId}`,
            { ...new Options(await this.getRequestOpts()), responseType: 'json' },
          ).json<ApiResultResponse>();

        if (res?.result) {
          return {
            message: '',
            errorCode: '',
            isSuccess: true,
            data: { responseId, ...res.result },
            endTime: res.service_usage.end_time,
            startTime: res.service_usage.start_time,
            timeElapsedAsSec: (
              new Date(res.service_usage.end_time).getTime() - new Date(res.service_usage.start_time).getTime()) * 1000,
          };
        }

        if (res?.error?.code) {
          return {
            isSuccess: false,
            data: { responseId },
            errorCode: res.error.code,
            message: res.error.message,
            endTime: res.service_usage.end_time,
            startTime: res.service_usage.start_time,
            timeElapsedAsSec: (
              new Date(res.service_usage.end_time).getTime() - new Date(res.service_usage.start_time).getTime()) * 1000,
          };
        }

        const exp = Math.pow(2, retryCount);

        if (exp > this.maxRequestTimeoutAsSec) {
          return {
            isSuccess: false,
            data: { responseId },
            errorCode: EkycClientErrorCode.resultTimeout,
            message: `fail to wait for result due to "maxRequestTimeoutAsSec(${this.maxRequestTimeoutAsSec})" reached`,
            endTime: null,
            startTime: null,
            timeElapsedAsSec: null,
          };
        }

        await this.sleep(exp);

        retryCount += 1;
      } catch (err) {
        return {
          isSuccess: false,
          data: { responseId },
          message: err.toString(),
          errorCode: EkycClientErrorCode.unexpectedError,
          endTime: null,
          startTime: null,
          timeElapsedAsSec: null,
        };
      } 
    } 
  }
}
