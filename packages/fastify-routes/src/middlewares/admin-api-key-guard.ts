
import { FastifyReply, FastifyRequest } from 'fastify';

export const adminApiKeyGuard = async (request: FastifyRequest, reply: FastifyReply) => {
  if (request.headers['x-api-key'] === process.env['ADMIN_API_KEY']) {
    return;
  }

  reply.code(403);

  throw new Error('unauthorized');
};
