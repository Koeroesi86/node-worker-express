const { createHash } = require('crypto');
const { STATUS_CODES } = require('http');

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const timers = {};

const createDigest = key => createHash('sha1')
  .update(key + GUID)
  .digest('base64');

module.exports = (event, callback) => {
  if (event.protocol === 'WS' && event.frame === undefined) {
    const key = (event.headers['sec-websocket-key'] || '').trim();
    const digest = createDigest(key);

    if (key) {
      if (event.closed) {
        clearInterval(timers[key]);
        timers[key] = null;
        delete timers[key];
        return;
      }
      const body = STATUS_CODES[101];
      callback({
        statusCode: 101,
        headers: {
          Upgrade: 'websocket',
          Connection: 'Upgrade',
          'Sec-WebSocket-Accept': `${digest}`,
        },
        body
      });

      timers[key] = setInterval(() => {
        const frame = JSON.stringify({ now: Date.now() })
        console.log('outgoing message:', frame);
        callback({
          sendWsMessage: true,
          frame,
        });
      }, 1000);
      return;
    }
  }

  if (event.protocol === 'WS' && event.frame !== undefined) {
    console.log('incoming message:', event.frame);
    return;
  }

  callback({
    statusCode: 400,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=0',
    },
    body: '',
    isBase64Encoded: false,
  });
};
