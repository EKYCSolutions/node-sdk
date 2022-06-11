
### NodeJS SDK for EKYCSolutions API
---

### Table of Contents
0. [Development](#development)

### Development
0. clone the repo
1. run `yarn install` to install deps
2. run `npm i -g verdaccio` to install local npm registry
3. start and configure `verdaccio` to allow all access in local

    a. run `verdaccio` to start local npm registry

    b. lookup `verdaccio` doc to configure anonymous access or ensure `verdaccio` config contains these line below
    ```yaml
    # default location is at ~/.config/verdaccio/config.yaml
    # looks for following section and update to anonymous
    # ...more blocks

    packages:
      '@*/*':
        access: $all
        publish: $anonymous
        unpublish: $anonymous
        proxy: npmjs

      '**':
        access: $all
        publish: $anonymous
        unpublish: $anonymous
        proxy: npmjs

    # ...more blocks
    ```

    c. run `yarn publish.local` to publish `@ekycsolutions/*` packages to local npm registry

    d. run `yarn unpublish.local` to unpublish `@ekycsolutions/*` packages from local npm registry (for clean up or publish same package version during/after development)

    e. back to project repo, add `.npmrc` with the following content
    ```
    registry=http://localhost:4873/
    //localhost:4873/:_authToken=fake
    ```
    NOTE: during sdk development, rename or remove `.npmrc` file away from using localhost as proxy to install npm packages to avoid telling `yarn.lock` to npm package from local registry
4. create a new nodejs project, `mkdir my-awesome-app && cd my-awesome-app && npm init -y`
5. install your choice of server library, eg: `npm i fastify`
6. for `ml-vision` sdk, install the library `npm i @ekycsolutions/ml-vision --registry http://localhost:4873`
7. create an account, create a project, create an api credential and name it `api-key.json`
8. prepare an id card photo to be used for this testing and the following code will call an `ocr` request to do `id-ocr` so save the code at `main.mjs`
```javascript
// my-awesome-app/main.mjs
import path from 'path';

import Fastify from 'fastify';
import { EkycClient } from '@ekycsolutions/client';
import { MLVision } from '@ekycsolutions/ml-vision';

// configure server address as you see fit
// see more at ekyc-server repo and default
// development port of the server for https is at 4443
const ekycClient = new EkycClient({
  serverAddress: 'https://server.localhost:4443',
  auth: {
    caCertificatePath: '/tmp/ca.cert.pem',
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
9. run the server `node main.mjs`
10. test the endpoint `curl -X POST http://localhost:5000/test-id-ocr -H 'Content-Type: application/json' -d '{"imageUrl": "https://example.com/sample-national-id.jpg"}'`
