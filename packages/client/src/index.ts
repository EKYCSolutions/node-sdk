
import { Auth, AuthOptions } from '@ekycsolutions/auth';

import got, { Options, OptionsOfJSONResponseBody } from 'got';

import { EkycClientErrorCode } from './error-code.js';

export interface EkycClientOptions {
  auth: AuthOptions;
  serverAddress?: string;
  maxRequestTimeoutAsSec?: number;
}

export interface ApiResultResponse {
  ml_result: any;
}

export interface ApiResult {
  data: any;
  message: string;
  errorCode: string;
  isSuccess: boolean;
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

  public async getRequestOpts(): Promise<Options> {
    const authRequestOpts = await this.auth.getRequestOpts();

    return new Options({
      responseType: 'json',
      prefixUrl: this.serverAddress,
      https: { ...authRequestOpts, minVersion: 'TLSv1.3', rejectUnauthorized: true },
    });
  }

  public async makeRequest(endpoint: string, options: Options): Promise<ApiResult> {
    const requestOpts = await this.getRequestOpts();

    requestOpts.merge(options);

    const mlRequestResult = await got(
      endpoint, requestOpts as OptionsOfJSONResponseBody).json<{ id: string; }>();

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
            { ...await this.getRequestOpts(), responseType: 'json' },
          ).json<ApiResultResponse>();

        if (res?.ml_result) {
          return {
            message: '',
            errorCode: '',
            isSuccess: true,
            data: { responseId, ...res.ml_result },
          };
        }

        const exp = Math.pow(2, retryCount);

        if (exp > this.maxRequestTimeoutAsSec) {
          return {
            isSuccess: false,
            data: { responseId },
            errorCode: EkycClientErrorCode.resultTimeout,
            message: `fail to wait for result due to "maxRequestTimeoutAsSec(${this.maxRequestTimeoutAsSec})" reached`,
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
        };
      } 
    } 
  }
}
