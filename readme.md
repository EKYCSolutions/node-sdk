![image](https://user-images.githubusercontent.com/81238558/175767662-be4dc9ba-a6bd-459d-aaa3-f8ad0c96aa37.png)

# EkycID Node SDK
### NodeJS SDK for EKYCSolutions API
---

### Table of Contents
0. [Getting Started](#getting-started)
1. [Fastify Routes Plugin](#fastify-routes-plugin)

### Pre-Requisite
- An account at https://console.ews.ekycsolutions.com
- A project created on the web console
- An api credential and name it `api-key.json`


### Getting Started
0. create a new nodejs project, `mkdir my-awesome-app && cd my-awesome-app && npm init -y`
1. install your choice of server library, eg: `npm i fastify`
2. for `ml-vision` sdk, install the library `npm i got @ekycsolutions/client @ekycsolutions/ml-vision`
3. prepare an id card photo to be used for this testing and the following code will call an `ocr` request to do `id-ocr` so save the code at `main.mjs`
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
4. run the server `node main.mjs`
5. test the endpoint `curl -X POST http://localhost:5000/test-id-ocr -H 'Content-Type: application/json' -d '{"imageUrl": "https://example.com/sample-national-id.jpg"}'`

---

### Fastify Routes Plugin
#### We also provide fastify plugin that has predefined routes for all our ml api
0. create a new nodejs project, `mkdir my-awesome-app && cd my-awesome-app && npm init -y`
1. install some deps, `npm i got @ekycsolutions/client @ekycsolutions/fastify-routes @ekycsolutions/ml-vision @fastify/multipart @fastify/static fastify fastify-plugin`

    NOTE: if you test the sdk in local environment, also install `ngrok` by doing `npm i ngrok --dev` and run `ngrok http 5000`, and save the address for later used below
2. prepare an id card photo to be used for this testing and the following code will call an `ocr` request to do `id-ocr` so save the code at `main.mjs`
```javascript
// my-awesome-app/main.mjs

// NOTE: the below code is for testing purpose,
// please follow javascript best practices and
// apply some coding patterns

// for api references, please visit: https://docs.ews.ekycsolutions.com
import path from 'path';

import Fastify from 'fastify';
import { ekycRoutesPlugin } from '@ekycsolutions/fastify-routes';

const fastify = Fastify({
  logger: true,
});

fastify.register(ekycRoutesPlugin, {
  ekycPluginArgs: {
    auth: {
      clientCertSavePath: '/tmp/client.cert.pem',
      clientCertKeySavePath: '/tmp/client.key.pem',
      apiKeyPath: path.resolve('./', 'api-key.json'),
    },
  }, 
  ekycRoutesPluginArgs: {
    // for local development, copy address returned from ngrok
    // and pass it here
    serverUrl: 'example.com',

    // for non local development
    // serverUrl: 'x.x.x.x:xxxxx'
    // serverUrl: 'example.com'

    // non local development that uses local storage driver
    // but does not run dedicated file server
    // true by default
    // isServeUploadFiles: true,

    // valid value are 'local'
    // fileStorageDriver: 'local',

    // hook to get api result before sending
    // response to client
    onMlApiResult: (onMlApiResult, metadata) => {
      console.log('==== ml api result ====');
      console.log(JSON.stringify(onMlApiResult, null, 2));
      console.log('==== ml api metadata ====');
      console.log(metadata);
    },
  },
});

fastify.listen({ port: 5000 }, err => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
```
3. run the server `node main.mjs`
4. test the endpoint `curl -X POST http://localhost:5000/v0/ocr -F image=@/path/to/national-id-card.jpg -F objectType=NATIONAL_ID_0`
