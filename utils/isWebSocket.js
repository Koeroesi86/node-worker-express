/**
 * @param {module:http~IncomingMessage} request
 * @returns {boolean}
 */
const isWebSocket = request => {
  if (request.method !== 'GET') return false;

  const connection = request.headers.connection || '';
  const upgrade = request.headers.upgrade || '';

  return request.method === 'GET' &&
    connection.toLowerCase().split(/ *, */).indexOf('upgrade') >= 0 &&
    upgrade.toLowerCase() === 'websocket';
};

module.exports = isWebSocket;
