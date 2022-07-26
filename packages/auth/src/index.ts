
import { TextDecoder } from 'util';
import { X509Certificate } from 'crypto';
import { existsSync, readFileSync, createWriteStream, writeFileSync } from 'fs';

import * as jose from 'jose';
import got, { HttpsOptions } from 'got';

export interface AuthOptions {
  apiKeyPath: string;
  caCertificatePath?: string;
  clientCertSavePath?: string;
  clientCertKeySavePath?: string;
}

export interface AuthOpts extends AuthOptions {
  serverAddress: string;
}

export class Auth {
  readonly apiKeyPath: string;
  readonly serverAddress: string;
  readonly caCertificatePath: string;
  readonly clientCertSavePath: string;
  readonly clientCertKeySavePath: string;

  clientCert: X509Certificate;

  constructor({ serverAddress, apiKeyPath, caCertificatePath, clientCertSavePath, clientCertKeySavePath }: Readonly<AuthOpts>) {
    this.apiKeyPath = apiKeyPath;
    this.serverAddress = serverAddress;
    this.caCertificatePath = caCertificatePath;

    this.clientCertSavePath = clientCertSavePath ?? '/tmp/client.cert.pem';
    this.clientCertKeySavePath = clientCertKeySavePath ?? '/tmp/client.key.pem';
  }

  async getCertDownloadUrl(): Promise<string> {
    return (await got.post(`${this.serverAddress}/api-keys/${JSON.parse(readFileSync(this.apiKeyPath).toString('utf8')).key_id}/cert-download-url`, {
      https: {
        certificateAuthority: this.caCertificatePath ? readFileSync(this.caCertificatePath) : undefined,
      },
    })).body;
  }

  public async getRequestOpts(): Promise<HttpsOptions> {
    const x509Cert =
      this.isClientCertExpired()
        ? await this.downloadClientCert()
        : this.loadClientCert();

    if (x509Cert?.serialNumber) {
      return {
        certificate: x509Cert.toString(),
        key: readFileSync(this.clientCertKeySavePath),
        certificateAuthority: this.caCertificatePath ? readFileSync(this.caCertificatePath) : undefined,
      };
    }
  }

  public downloadClientCert(): Promise<X509Certificate> {
    return new Promise(async (resolve, reject) => {
      const writeStream = createWriteStream('/tmp/cert-content', { flags: 'w' });

      const downloadStream = got.stream(await this.getCertDownloadUrl());

      writeStream.on('error', err => {
        reject(err);
      });

      downloadStream.on('error', err => {
        reject(err);
      });

      writeStream.on('finish', async () => {
        const { plaintext } = await jose.compactDecrypt(
          readFileSync('/tmp/cert-content').toString('utf8'),
          await jose.importPKCS8(JSON.parse(readFileSync(this.apiKeyPath).toString('utf8')).private_key, 'X25519')
        );

        const keyCert = JSON.parse(new TextDecoder().decode(plaintext));

        writeFileSync(this.clientCertSavePath, keyCert.certificate, { flag: 'w' });
        writeFileSync(this.clientCertKeySavePath, keyCert.private_key, { flag: 'w' });

        const x509Cert = this.loadClientCert({ isLoadNew: true });

        resolve(x509Cert);
      });

      downloadStream.pipe(writeStream);
    }); 
  }

  public loadClientCert({ isLoadNew }: { isLoadNew?: boolean; } = {}): X509Certificate {
    if (!isLoadNew && this.clientCert?.serialNumber) {
      return this.clientCert;
    }

    const x509Cert = new X509Certificate(readFileSync(this.clientCertSavePath));

    if (x509Cert?.serialNumber) {
      this.clientCert = x509Cert;
      return x509Cert;
    }

    return null;
  }

  public isClientCertExists(): boolean {
    if (existsSync(this.clientCertSavePath)) {
      if (this.clientCert?.serialNumber) {
        return true; 
      }

      return !!this.loadClientCert()?.serialNumber;
    }

    return false;
  }

  public isClientCertExpired(): boolean {
    return !this.isClientCertExists() || new Date(this.clientCert.validTo) < new Date();
  }
}
