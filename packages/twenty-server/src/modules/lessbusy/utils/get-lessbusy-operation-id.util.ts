import { createHash } from 'node:crypto';

export const getLessBusyOperationId = (seed: string): string => {
  const hash = createHash('sha256').update('21ec822f-cd03-4479-a8f8-e5cdd0c0670a:').update(seed).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
};
