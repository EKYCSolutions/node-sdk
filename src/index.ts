
import { JWK, JWE, JWT } from 'jose';

interface APIKeyJson {
  key_id: string;
  app_id: string;
  client_id: string;
  secret: string;
  public_key: string;
}

export class APIKey {
  private secret: JWK.OctKey;
  private receipientPublicKey: JWK.OctKey;
  private apiKeyJson: APIKeyJson;

  constructor(apiKeyFilePath: string) {
    this.apiKeyJson = require(apiKeyFilePath);

    this.secret =
      JWK.asKey(this.apiKeyJson.secret) as JWK.OctKey
    this.receipientPublicKey =
      JWK.asKey(this.apiKeyJson.public_key) as JWK.OctKey
  }

  public signAndEncryptToken(): string {
    const token: string =
      JWT.sign(
        {},
        this.secret,
        { expiresIn: '2 minute'
        , header: { typ: 'JWT' }
        , subject: this.apiKeyJson.key_id
        , audience: this.apiKeyJson.app_id
        , issuer: this.apiKeyJson.client_id
        }
      );

    return JWE.encrypt(token, this.receipientPublicKey);
  }
}
