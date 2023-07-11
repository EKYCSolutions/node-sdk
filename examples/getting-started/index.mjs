
import path from 'path';

import Fastify from 'fastify';
import { ekycRoutesPlugin } from '@ekycsolutions/fastify-routes';

const fastify = Fastify({
  logger: true,
});

fastify.register(ekycRoutesPlugin, {
  ekycPluginArgs: {
    maxRequestTimeoutAsSec: 512,
    auth: {
      clientCertSavePath: '/tmp/client.cert.pem',
      clientCertKeySavePath: '/tmp/client.key.pem',
      apiKeyPath: path.resolve('./', 'api-key.json'),
    },
  },
  ekycRoutesPluginArgs: {
    serverUrl: 'http://bore.pub:59200'
  },
});

fastify.listen({ port: 5000 }, err => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
