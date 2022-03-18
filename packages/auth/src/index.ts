
import { X509Certificate } from 'crypto';
import { existsSync, readFileSync, createWriteStream } from 'fs';

import got, { HttpsOptions } from 'got';

export interface AuthOptions {
  apiKeyPath: string;
  caCertificatePath?: string;
  clientCertSavePath?: string;
}

export class Auth {
  private readonly apiKeyPath: string;
  readonly caCertificatePath: string;
  readonly clientCertSavePath: string;
  readonly clientCertDownloadUrl: string;

  clientCert: X509Certificate;

  constructor({ apiKeyPath, caCertificatePath, clientCertSavePath }: Readonly<AuthOptions>) {
    this.apiKeyPath = apiKeyPath;
    this.caCertificatePath = caCertificatePath;

    this.clientCertSavePath = clientCertSavePath ?? '/tmp/client.cert.pem';

    this.clientCertDownloadUrl =
      JSON.parse(readFileSync(this.apiKeyPath).toString('utf8')).client_cert_url;
  }

  public async getRequestOpts(): Promise<HttpsOptions> {
    const x509Cert =
      this.isClientCertExpired()
        ? await this.downloadClientCert()
        : this.loadClientCert();

    if (x509Cert?.serialNumber) {
      return {
        certificate: x509Cert.toString(),
        key: JSON.parse(readFileSync(this.apiKeyPath).toString('utf8')).private_key,
        certificateAuthority: this.caCertificatePath ? readFileSync(this.caCertificatePath) : undefined,
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
