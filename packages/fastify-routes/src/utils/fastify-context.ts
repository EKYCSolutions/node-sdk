
import { FastifyInstance, FastifyRequest } from 'fastify';

export const putMlReqArgs = (fas: FastifyInstance, req: FastifyRequest, mlReqArgs: any) => {
  fas.decorateRequest(`${req.id}.mlReqArgs`, mlReqArgs);
};

export const getMlReqArgs = (req: any) => req[`${req.id}.mlReqArgs`];
