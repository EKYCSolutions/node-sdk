
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

export class Auth {
  private readonly apiKeyPath: string;
  readonly caCertificatePath: string;
  readonly clientCertSavePath: string;
  readonly clientCertKeySavePath: string;
  readonly clientCertDownloadUrl: string;

  clientCert: X509Certificate;

  constructor({ apiKeyPath, caCertificatePath, clientCertSavePath, clientCertKeySavePath }: Readonly<AuthOptions>) {
    this.apiKeyPath = apiKeyPath;
    this.caCertificatePath = caCertificatePath;

    this.clientCertSavePath = clientCertSavePath ?? '/tmp/client.cert.pem';
    this.clientCertKeySavePath = clientCertKeySavePath ?? '/tmp/client.key.pem';

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
        key: readFileSync(this.clientCertKeySavePath),
        certificateAuthority: this.caCertificatePath ? readFileSync(this.caCertificatePath) : undefined,
      };
    }
  }

  public downloadClientCert(): Promise<X509Certificate> {
    return new Promise((resolve, reject) => {
      const writeStream = createWriteStream('/tmp/cert-content', { flags: 'w' });

      const downloadStream = got.stream(this.clientCertDownloadUrl);

      writeStream.on('error', err => {
        reject(err);
      });

      downloadStream.on('error', err => {
        reject(err);
      });

      downloadStream.on('finish', async () => {
        const { plaintext } = await jose.compactDecrypt(
          readFileSync('/tmp/cert-content').toString('utf8'),
          await jose.importPKCS8(JSON.parse(readFileSync(this.apiKeyPath).toString('utf8')).private_key, 'X25519')
        );

        const keyCert = JSON.parse(new TextDecoder().decode(plaintext));

        writeFileSync(this.clientCertSavePath, keyCert.cert, { flag: 'w' });
        writeFileSync(this.clientCertKeySavePath, keyCert.key, { flag: 'w' });

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
    return !this.isClientCertExists() || new Date(this.clientCert.validTo) < new Date();
  }
}
