import { execSync } from 'child_process';

// Byte order mark
const isUtf8 = (body: Buffer) => body[0] === 0xef && body[1] === 0xbb && body[2] === 0xbf;
const isUtf16be = (body: Buffer) => body[0] === 0xfe && body[1] === 0xff;
const isUtf16le = (body: Buffer) => body[0] === 0xff && body[1] === 0xfe;

// TODO: implement
async function getCharset(body: Buffer, fileName: string): Promise<string> {
  if (isUtf8(body)) return 'utf8';
  if (isUtf16be(body)) return 'utf16be';
  if (isUtf16le(body)) return 'utf16le';
  if (body.indexOf('ï»¿') === 0) return 'iso-8859-1';

  try {
    return execSync(`file -b --mime-encoding ${fileName}`, { encoding: 'utf8' }).trim();
  } catch (e) {
    //
  }

  return '';
}

export default getCharset;
