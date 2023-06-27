
import { hmac } from '@noble/hashes/hmac';
import axios, { AxiosInstance } from 'axios';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha3_256 } from '@noble/hashes/sha3';
import { bytesToHex } from '@noble/hashes/utils';

export { createPublishableKey } from './utils/create-key.js';

export interface PublishableApiKey {
  key_id: string;
  app_id?: string;
  client_key: string;
  client_pkey: string;
}

export interface AuthBrowserOpts {
  serverAddress: string;
  apiKey: PublishableApiKey;
}

export class AuthBrowser {
  readonly serverAddress: string;
  readonly apiKey: PublishableApiKey;
  readonly httpClient: AxiosInstance;

  private token;

  constructor({ apiKey, serverAddress }: AuthBrowserOpts) {
    this.apiKey = apiKey;
    this.serverAddress = serverAddress;
    this.httpClient = axios.create({
      baseURL: this.serverAddress,
    });
  }

  async getRequestOpts() {
    if (this.token?.exp) {
      if (new Date(this.token.exp * 1000 - 800) >= new Date()) {
        return {
          headers: {
            authorization: `Bearer ${this.token}`,
          },
        };
      }
    }

    const resp = await this.httpClient.post(`/v0/api-token`, { key_id: this.apiKey.key_id });

    const payload = JSON.parse(window.atob(resp.data.token.split('.')[1]));

    const hash = bytesToHex(pbkdf2(sha3_256, this.apiKey.client_key, payload.slt, { c: 32, dkLen: 32 }));

    const cak = window.btoa(String.fromCharCode.apply(null, hmac(sha3_256, payload.fgp, hash.substring(hash.length/2))));

    if (cak === payload.cak) {
      this.token = resp.data.token;

      return {
        headers: {
          authorization: `Bearer ${this.token}`,
        },
      };
    }

    return {};
  }
}
