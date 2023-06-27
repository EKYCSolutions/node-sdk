
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
    k,
    s,
    clientK,
    clientPubKey,
    clientP: window.btoa(String.fromCharCode.apply(null, clientP)),
  };
};
