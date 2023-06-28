
import { randomUUID } from 'crypto';
import { writeFileSync, mkdirSync } from 'fs';

import FormData from 'form-data';
import got, { Options, OptionsInit } from 'got';

import { apiResultPolling } from './utils.js';
import { Auth, AuthOptions } from '@ekycsolutions/auth';
import { ApiResult, ApiResultResponse, PrepareFormDataMeta } from './interface.js';

export interface EkycClientOptions {
  auth: AuthOptions;
  serverAddress?: string;
  maxRequestTimeoutAsSec?: number;
}

export class EkycClient {
  private readonly auth: Auth;
  readonly serverAddress: string;
  readonly maxRequestTimeoutAsSec: number;

  constructor({ auth, serverAddress, maxRequestTimeoutAsSec }: Readonly<EkycClientOptions>) {
    const srvAddress = serverAddress ?? 'https://server.ews.ekycsolutions.com';
    this.serverAddress = srvAddress;
    this.maxRequestTimeoutAsSec = maxRequestTimeoutAsSec ?? 64;
    this.auth = new Auth({ ...auth, serverAddress: srvAddress });
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

  public async apiResultPolling(responseId: string): Promise<ApiResult> {
    return apiResultPolling({
      responseId,
      maxRequestTimeoutAsSec: this.maxRequestTimeoutAsSec,
      getRes: async () => await got(
        `v0/api-request-reply/${responseId}`,
        { ...new Options(await this.getRequestOpts()), responseType: 'json' },
      ).json<ApiResultResponse>(),
    });
  }
}
