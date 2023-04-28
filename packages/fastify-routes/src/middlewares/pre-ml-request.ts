
import { FastifyReply, FastifyRequest } from 'fastify';

import { EkycRoutesOpts } from '../types.js';
import { apiMetadata } from '../api-metadata.js';

export const preMlRequest = async (req: FastifyRequest, reply: FastifyReply) => {
  const opts: EkycRoutesOpts = (req as any).ekycRoutesOpts;

  if (opts?.preMlRequest?.apply) {
    const apiName = req.url.split('/')[2];

    await opts.preMlRequest({ req, reply }, {
      apiResult: null,
      metadata: {
        apiName,
        apiVersion: apiMetadata[apiName][0].versionName,
      },
    });
  }
}
