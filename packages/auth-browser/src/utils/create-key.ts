
import { nanoid } from 'nanoid';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha3_256 } from '@noble/hashes/sha3';
import { x25519 } from '@noble/curves/ed25519';
import { bytesToHex } from '@noble/hashes/utils';

export const createPublishableKey = async () => {
  const k = nanoid(256);
  const s = nanoid(256);

  const clientP = x25519.utils.randomPrivateKey();

  const h = bytesToHex(pbkdf2(sha3_256, k, s, { c: 32, dkLen: 32 }));

  const clientK = h.substring(h.length/2);

  const clientPubKey = window.btoa(String.fromCharCode.apply(null, x25519.getPublicKey(clientP)));

  return {
    toSave: () => ({
      client_auth_key_salt: s,
      client_auth_key: clientK,
      client_public_key: clientPubKey,
    }),
    toDownloadJson: ({ appId, keyId }) => ({
      key_id: keyId,
      app_id: appId,
      client_key: k,
      client_pkey: window.btoa(String.fromCharCode.apply(null, clientP)),
    }),
  };
};
