
import { X509Certificate } from 'crypto';
import { existsSync, readFileSync, createWriteStream } from 'fs';

import got from 'got';

export interface AuthOptions {
  apiKeyPath: string;
  clientCertSavePath?: string;
}

interface AuthRequestOpts {
  key: Buffer;
  certificate: Buffer;
}

export class Auth {
  private readonly apiKeyPath: string;
  readonly clientCertSavePath: string;
  readonly clientCertDownloadUrl: string;

  clientCert: X509Certificate;

  constructor({ apiKeyPath, clientCertSavePath }: Readonly<AuthOptions>) {
    this.apiKeyPath = apiKeyPath;

    this.clientCertSavePath = clientCertSavePath ?? '/tmp/client.cert.pem';

    this.clientCertDownloadUrl =
      JSON.parse(readFileSync(this.apiKeyPath).toString('utf8')).client_cert_url;
  }

  public async getRequestOpts(): Promise<AuthRequestOpts> {
    const x509Cert =
      this.isClientCertExpired()
        ? await this.downloadClientCert()
        : this.loadClientCert();

    if (x509Cert?.serialNumber) {
      return {
        certificate: x509Cert.raw,
        key: JSON.parse(readFileSync(this.apiKeyPath).toString('utf8')).private_key,
      };
    }
  }

  public downloadClientCert(): Promise<X509Certificate> {
    return new Promise((resolve, reject) => {
      const writeStream = createWriteStream(this.clientCertSavePath, { flags: 'w' });

      const downloadStream = got.stream(this.clientCertDownloadUrl);

      writeStream.on('error', err => {
        reject(err);
      });

      downloadStream.on('error', err => {
        reject(err);
      });

      downloadStream.on('finish', () => {
        const x509Cert = this.loadClientCert();

        resolve(x509Cert);
      });

      downloadStream.pipe(writeStream);
    }); 
  }

  public loadClientCert(): X509Certificate {
    if (this.clientCert?.serialNumber) {
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
    return this.isClientCertExists() && new Date(this.clientCert.validTo) < new Date();
  }
}
