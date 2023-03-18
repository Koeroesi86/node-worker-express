import { createHash } from 'crypto';

const emptyEtag = '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"';

function getEtag(body: Buffer) {
  if (body.length === 0) {
    // fast-path empty
    return emptyEtag;
  }

  // compute hash of entity
  const hash = createHash('sha1').update(body.toString('utf8'), 'utf8').digest('base64').substring(0, 27);

  // compute length of entity
  const len = typeof body === 'string' ? Buffer.byteLength(body, 'utf8') : body.length;

  return `"${len.toString(16)}-${hash}"`;
}

export default getEtag;
