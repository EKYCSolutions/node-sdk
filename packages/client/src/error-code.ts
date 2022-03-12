
export const EkycClientErrorPrefix = 'ekyc-client';

export const EkycClientErrorCode = Object.freeze({
  resultTimeout: `${EkycClientErrorPrefix}@0`,
  unexpectedError: `${EkycClientErrorPrefix}@99`,
});
