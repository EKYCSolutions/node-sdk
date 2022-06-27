# `@ekycsolutions/ml-vision`

### Getting Started
0. create a new nodejs project, `mkdir my-awesome-app && cd my-awesome-app && npm init -y`
1. install your choice of server library, eg: `npm i fastify`
2. for `ml-vision` sdk, install the library `npm i got @ekycsolutions/client @ekycsolutions/ml-vision`
3. create an account at https://console.ews.ekycsolutions.com, create a project, create an api credential and name it `api-key.json`
4. prepare an id card photo to be used for this testing and the following code will call an `ocr` request to do `id-ocr` so save the code at `main.mjs`
```javascript
// my-awesome-app/main.mjs

// NOTE: the below code is for testing purpose,
// please follow javascript best practices and
// apply some coding patterns

// for api references, please visit: https://docs.ews.ekycsolutions.com
import path from 'path';

import Fastify from 'fastify';
import { EkycClient } from '@ekycsolutions/client';
import { MLVision } from '@ekycsolutions/ml-vision';

const ekycClient = new EkycClient({
  serverAddress: 'https://server.ews.ekycsolutions.com',
  auth: {
    clientCertSavePath: '/tmp/client.cert.pem',
    clientCertKeySavePath: '/tmp/client.key.pem',
    apiKeyPath: path.resolve('./', 'api-key.json'),
  },
});

const mlVision = new MLVision(ekycClient);

const fastify = Fastify({
  logger: true,
});

fastify.post('/test-id-ocr', async (req, reply) => {
  const result = await mlVision.ocr({
    isRaw: true,
    objectType: 'national_id',
    imageUrl: req.body['imageUrl'],
  });

  reply.send(result);
});

fastify.listen(5000, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
```
5. run the server `node main.mjs`
6. test the endpoint `curl -X POST http://localhost:5000/test-id-ocr -H 'Content-Type: application/json' -d '{"imageUrl": "https://example.com/sample-national-id.jpg"}'`
