![image](https://user-images.githubusercontent.com/81238558/175767662-be4dc9ba-a6bd-459d-aaa3-f8ad0c96aa37.png)

# EkycID Node SDK

# `@ekycsolutions/fastify-routes`
The EkycID Node SDK lets you build a factastic OCR and Face Recognition experienced in your iOS app.

With one quick scan, your users will be able to extract information from thier identity cards, passports, driver licenses, license plate, vehicle registration, covid-19 vaccinate card, and any other document by government-issued.


EkycID is:
* Easy to integrate into existing ecosystems and solutions through the use of SDKs that supported both native and hybrid applications.
* Better for user experience being that the document detections and liveness checks are done directly offline on the device.
* Great for cutting down operations cost and increasing efficiency by decreasing reliance on human labor and time needed for manual data entry. 


EkycID can:
* Extract information from identity documents through document recognition & OCR.
* Verify whether an individual is real or fake through liveness detection, and face recognition. 
* Verify the authenticity of the identity documents by combining the power of document detection, OCR, liveness detection, and face recognition. 


To see all of these features at work download our free demo app at PlayStore. For iOS device is recently in review from apple, you can try it on TestFlight by contact our developers.

## Getting Started
0. create a new nodejs project, `mkdir my-awesome-app && cd my-awesome-app && npm init -y`
1. install some deps, `npm i got @ekycsolutions/client @ekycsolutions/fastify-routes @ekycsolutions/ml-vision @fastify/multipart @fastify/static fastify fastify-plugin`

    NOTE: if you test the sdk in local environment, also install `ngrok` by doing `npm i ngrok --dev` and run `ngrok http 5000`, and save the address for later used below
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
import { ekycRoutesPlugin } from '@ekycsolutions/fastify-routes';

const fastify = Fastify({
  logger: true,
});

fastify.register(ekycRoutesPlugin, {
  ekycPluginArgs: {
    serverAddress: 'https://server.ews.sandbox.ekycsolutions.com',
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

    // valid value are 'local' | 's3'
    // fileStorageDriver: 'local',

    // for s3 config
    // s3Url: 'bucket.us-east-1.amazonaws.com',
    // s3AccessKeyId: 'abc',
    // s3SecretAccessKey: 'def',
  },
});

fastify.listen({ port: 5000 }, err => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
```
5. run the server `node main.mjs`
6. test the endpoint `curl -X POST http://localhost:5000/v0/ocr -F image=@/path/to/national-id-card.jpg -F objectType=NATIONAL_ID_0`

# Contact
For any other questions, feel free to contact us at <a href="https://ekycsolutions.com/">ekycsolutions.com</a>.

# License

© 2022 EKYC Solutions Co, Ltd. All rights reserved.
