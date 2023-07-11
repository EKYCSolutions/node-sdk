
import axios from 'axios';

import { apiResultPolling } from './utils.js';
import { PrepareFormDataMeta, ApiResult } from './interface.js';
import { AuthBrowser, AuthBrowserOpts } from '@ekycsolutions/auth-browser';

export * from './interface.js';
export * from './error-code.js';

export interface EkycClientBrowserOptions {
  auth: AuthBrowserOpts;
  serverAddress?: string;
  maxRequestTimeoutAsSec?: number;
}

export class EkycClientBrowser {
  private readonly auth: AuthBrowser;
  readonly serverAddress: string;
  readonly maxRequestTimeoutAsSec: number;

  constructor({ auth, serverAddress, maxRequestTimeoutAsSec }: Readonly<EkycClientBrowserOptions>) {
    const srvAddress = serverAddress ?? 'https://server.ews.ekycsolutions.com';
    this.serverAddress = srvAddress;
    this.maxRequestTimeoutAsSec = maxRequestTimeoutAsSec ?? 64;
    this.auth = new AuthBrowser({ ...auth, serverAddress: srvAddress });
  }

  public async getRequestOpts(): Promise<{ [key: string]: any; }> {
    return await this.auth.getRequestOpts();
  }

  public prepareFormData(_: PrepareFormDataMeta): any {
    const formData = new window.FormData();

    const idempotentId = window.crypto.randomUUID();

    formData.append('idempotent_id', idempotentId);

    return formData;
  }

  public async makeRequest(endpoint: string, formData: any): Promise<ApiResult> { 
    const requestOpts = await this.getRequestOpts();

    requestOpts.headers['Content-Type'] = 'multipart/form-data';

    const mlRequestResult = (await axios.post(
      `${this.serverAddress}/${endpoint}`, formData, { ...requestOpts, withCredentials: true })).data;

    if (mlRequestResult?.id) {
      return await this.apiResultPolling(mlRequestResult.id);
    }

    return null;
  }

  public async apiResultPolling(responseId: string): Promise<ApiResult> {
    return apiResultPolling({
      responseId,
      maxRequestTimeoutAsSec: this.maxRequestTimeoutAsSec,
      getRes: async () => (await axios.post(
        `${this.serverAddress}/v0/api-request-reply/${responseId}`,
        {}, { ...(await this.getRequestOpts()), withCredentials: true }
      )).data,
    });
  }
}
