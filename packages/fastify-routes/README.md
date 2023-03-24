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
    // NOTE: use `postMlRequestBeforeSend` hook instead if you want to
    // do some processing after getting ml request
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
5. run the server `node main.mjs`
6. test the endpoint `curl -X POST http://localhost:5000/v0/ocr -F image=@/path/to/national-id-card.jpg -F objectType=NATIONAL_ID_0`

## Fastify Lifecycle Hook
If you need to do something or modify response before it gets sent to the client, hook up to fastify lifecycle hook to do so
```javascript
// ... rest of body omitted

fastify.register(ekycRoutesPlugin, {
  // ... more options omitted
  ekycRoutesPluginArgs: {
    // ... more options omitted
    // hook up to `postMlRequestBeforeSend` to do stuff with the response
    // before it is being sent
    // eg. modify the response, database mutation or validation etc
    // NOTE: if used with ekycsolutions's mobile app sdk
    // keep the payload response as it is by not returning
    postMlRequestBeforeSend: async ({ req, reply, done }, { apiResult, metadata }) => {
      console.log('==== ml api result ====');
      console.log(JSON.stringify(apiResult, null, 2));
      console.log('==== ml api metadata ====');
      console.log(metadata);

      // do your stuff here
      // get user, insert if not exists
      // validate business logic stuff
      // modify response or not

      // if you want to return error back as response
      // there are multiple approach

      // throw new Error('fail to validate user from backend'); // throw error directly

      // return { error: new Error('fail to validate user from backend'), newPayload: null }; // return an object with non-empty error property

      // reply.code(422); done(new Error('fail to validate user from backend')); // set response status code and send error back

      // for more info, refer to https://www.fastify.io/docs/latest/Reference/Hooks/#preserialization
      // since underlying of the method uses `preSerialization` hook
    },
    // ... more options omitted
  },
  // ... more options omitted
});

// ... rest of body omitted
```

# Contact
For any other questions, feel free to contact us at <a href="https://ekycsolutions.com/">ekycsolutions.com</a>.

# License

© 2022 EKYC Solutions Co, Ltd. All rights reserved.
