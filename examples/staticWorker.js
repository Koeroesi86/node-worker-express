const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let timer;

function debounce(fn = () => {}, timeout = 0) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = undefined;
    fn();
  }, timeout);
}

function getContentType(extension = '') {
  const contentTypes = {
    '.aac':	'audio/aac',
    '.abw':	'application/x-abiword',
    '.arc':	'application/x-freearc',
    '.avi':	'video/x-msvideo',
    '.azw':	'application/vnd.amazon.ebook',
    '.bin':	'application/octet-stream',
    '.bmp':	'image/bmp',
    '.bz': 'application/x-bzip',
    '.bz2': 'application/x-bzip2',
    '.csh': 'application/x-csh',
    '.css': 'text/css',
    '.csv': 'text/csv',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.eot': 'application/vnd.ms-fontobject',
    '.epub': 'application/epub+zip',
    '.gz': 'application/gzip',
    '.gif': 'image/gif',
    '.htm': 'text/html',
    '.html': 'text/html',
    '.ico': 'image/vnd.microsoft.icon',
    '.ics': 'text/calendar',
    '.jar': 'application/java-archive',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.jsonld': 'application/ld+json',
    '.mid': 'audio/midi',
    '.midi': 'audio/x-midi',
    '.mjs': 'text/javascript',
    '.mp3': 'audio/mpeg',
    '.mpeg': 'video/mpeg',
    '.mpkg': 'application/vnd.apple.installer+xml',
    '.odp': 'application/vnd.oasis.opendocument.presentation',
    '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
    '.odt': 'application/vnd.oasis.opendocument.text',
    '.oga': 'audio/ogg',
    '.ogv': 'video/ogg',
    '.ogx': 'application/ogg',
    '.opus': 'audio/opus',
    '.otf': 'font/otf',
    '.png': 'image/png',
    '.pdf': 'application/pdf',
    '.php': 'application/php',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.rar': 'application/vnd.rar',
    '.rtf': 'application/rtf',
    '.sh': 'application/x-sh',
    '.svg': 'image/svg+xml',
    '.swf': 'application/x-shockwave-flash',
    '.tar': 'application/x-tar',
    '.tif': 'image/tiff',
    '.tiff': 'image/tiff',
    '.ts': 'video/mp2t',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain',
    '.vsd': 'application/vnd.visio',
    '.wav': 'audio/wav',
    '.weba': 'audio/webm',
    '.webm': 'video/webm',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.xhtml': 'application/xhtml+xml',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xml': 'application/xml',
    '.xul': 'application/vnd.mozilla.xul+xml',
    '.zip': 'application/zip',
    '.3gp': 'video/3gpp',
    '.3g2': 'video/3gpp2',
    '.7z': 'application/x-7z-compressed',
};

  return contentTypes[extension] || contentTypes['.txt'];
}

function etag(body) {
  if (body.length === 0) {
    // fast-path empty
    return '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"';
  }

  // compute hash of entity
  const hash = crypto
    .createHash('sha1')
    .update(body, 'utf8')
    .digest('base64')
    .substring(0, 27);

  // compute length of entity
  const len = typeof body === 'string'
    ? Buffer.byteLength(body, 'utf8')
    : body.length;

  return `"${len.toString(16)}-${hash}"`
}

/**
 * TODO: implement
 * @param {Buffer} body
 * @returns {boolean|string}
 */
function getCharset(body) {
  return false;
}

const staticWorker = (event, callback = () => {}) => {
  debounce(() => {
    // console.log('Exiting static worker.')
  }, 5000);
  const currentPath = `${event.path.replace(/\.{2,}/, '')}${/\/$/.test(event.path) ? 'index.html' : ''}`;
  const fileName = path.resolve(event.rootPath, `.${currentPath}`);
  if (fs.existsSync(fileName)) {
    // TODO: range request
    const bodyBuffer = fs.readFileSync(fileName);
    const stats = fs.statSync(fileName);
    const extension = path.extname(fileName);
    const contentType = getContentType(extension);
    const currentEtag = etag(bodyBuffer);
    const charset = getCharset(bodyBuffer);
    const lastModified = new Date(stats.mtime);
    let isModified = true;

    if (event.headers['if-none-match'] === currentEtag) {
      isModified = false;
    } else if (event.headers['if-modified-since']) {
      const ifModifiedSince = new Date(event.headers['if-modified-since']);
      if (ifModifiedSince.toUTCString() === lastModified.toUTCString()) {
        isModified = false;
      }
    }

    callback({
      statusCode: isModified ? 200 : 304,
      headers: {
        'Content-Type': `${contentType}${charset ? `; charset=${charset}` : ''}`,
        'Cache-Control': 'public, max-age=0',
        'Content-Length': bodyBuffer.length,
        'ETag': currentEtag,
        ...(stats.mtime && { 'Last-Modified': lastModified.toUTCString() }),
      },
      body: bodyBuffer.toString('base64'),
      isBase64Encoded: true,
    });
  } else {
    callback({
      statusCode: 404,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=0',
      },
      body:`${fileName} does not exist`,
      isBase64Encoded: false,
    });
  }
};

module.exports = staticWorker;
