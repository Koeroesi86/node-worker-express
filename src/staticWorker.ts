import path from 'path';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { Writable } from 'stream';
import { InvokableWorker, ResponseEvent } from './types';
import fileExists from './utils/fileExists';
import getContentType from './utils/getContentType';
import getEtag from './utils/getEtag';
import getCharset from './utils/getCharset';

let timer: NodeJS.Timeout | undefined;

const features = {
  enableEmit: false,
};

function debounce(fn = () => {}, timeout = 0) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = undefined;
    fn();
  }, timeout);
}

const staticWorker: InvokableWorker = async (event, callback = () => {}) => {
  debounce(() => {
    console.log('Exiting static worker.');
    process.exit(0);
  }, 1000 * 60 * 30);

  const currentPath = `${event.path.replace(/\.{2,}/, '')}${/\/$/.test(event.path) ? 'index.html' : ''}`;
  const fileName = path.resolve(event.rootPath, `.${currentPath}`);

  if (['GET', 'HEAD'].includes(event.httpMethod) && (await fileExists(fileName))) {
    // TODO: range request
    const bodyBuffer = await fs.readFile(fileName);
    const stats = await fs.stat(fileName);
    const extension = path.extname(fileName);
    const contentType = getContentType(extension);
    const currentEtag = getEtag(bodyBuffer);
    const charset = await getCharset(bodyBuffer, fileName);

    const lastModified = new Date(stats.mtime);
    let isModified = true;

    if (event.headers['if-none-match'] === currentEtag) {
      isModified = false;
    } else if (stats.mtime && event.headers['if-modified-since']) {
      const ifModifiedSince = new Date(event.headers['if-modified-since']);
      isModified = ifModifiedSince.toUTCString() !== lastModified.toUTCString();
    }

    const response: ResponseEvent = {
      statusCode: isModified ? 200 : 304,
      headers: {
        'Content-Type': `${contentType}${charset ? `; charset=${charset}` : ''}`,
        'Cache-Control': 'public, max-age=0',
        'Content-Length': String(bodyBuffer.byteLength),
        ETag: currentEtag,
        ...(stats.mtime && { 'Last-Modified': lastModified.toUTCString() }),
      },
      body: '',
      isBase64Encoded: false,
    };

    if (features.enableEmit && isModified) {
      const writer = new Writable({
        write(chunk: Buffer, encoding: string, next: () => unknown) {
          response.emit = true;
          response.isBase64Encoded = true;
          response.body = chunk.toString('base64');
          // console.log('sending', chunk.length, 'bytes')
          callback(response);
          next();
        },
        destroy() {
          response.isBase64Encoded = false;
          response.emit = true;
          response.body = null;
          callback(response);
        },
      });

      createReadStream(fileName, {
        // encoding: 'binary',
        // encoding: 'utf-8',
        emitClose: false,
        autoClose: false,
        // highWaterMark: 16,
        start: 0,
        end: Infinity,
      }).pipe(writer);
      return;
    } else if (isModified) {
      response.body = bodyBuffer.toString('base64');
      response.isBase64Encoded = true;
    }

    callback(response);
  } else {
    callback({
      statusCode: 404,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=0',
      },
      body: `${currentPath} does not exist`,
      isBase64Encoded: false,
    });
  }
};

export default staticWorker;
