
import { tokenGuard } from './token-guard.js';
import { preMlRequest } from './pre-ml-request.js';
import { adminApiKeyGuard } from './admin-api-key-guard.js';

export enum Middleware {
  tokenGuard,
  preMlRequest,
  adminApiKeyGuard,
}

export const middlewares = {
  [Middleware.tokenGuard]: tokenGuard,
  [Middleware.preMlRequest]: preMlRequest,
  [Middleware.adminApiKeyGuard]: adminApiKeyGuard,
};
