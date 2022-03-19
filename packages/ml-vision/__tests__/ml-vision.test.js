
import path from 'path';

import { EkycClient } from '@ekycsolutions/client';

import { MLVision } from '../dist/index';

describe('@ekycsolutions/ml-vision', () => {
  it('needs tests', async () => {
    const ekycClient = new EkycClient({
      serverAddress: 'https://server.localhost:4443',
      auth: {
        caCertificatePath: '/tmp/ca.cert.pem',
        clientCertSavePath: '/tmp/client.cert.pem',
        clientCertKeySavePath: '/tmp/client.key.pem',
        apiKeyPath: path.resolve('../../packages/auth/__tests__', 'test-key.json'),
      },
    });

    const mlVision = new MLVision(ekycClient);

    console.log(await ekycClient.apiResultPolling('abc123123888888'));
  });
});
