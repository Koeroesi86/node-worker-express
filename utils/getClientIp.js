/**
 * @param {module:http~IncomingMessage} request
 * @returns {string}
 */
const getClientIp = request => {
  if (request.headers['x-client-ip']) {
    return request.headers['x-client-ip'];
  }

  if (request.headers['x-forwarded-for']) {
    return request.headers['x-forwarded-for'];
  }

  if (request.headers['cf-connecting-ip']) {
    return request.headers['cf-connecting-ip'];
  }

  if (request.headers['fastly-client-ip']) {
    return request.headers['fastly-client-ip'];
  }

  if (request.headers['true-client-ip']) {
    return request.headers['true-client-ip'];
  }

  if (request.headers['x-real-ip']) {
    return request.headers['x-real-ip'];
  }

  if (request.headers['x-cluster-client-ip']) {
    return request.headers['x-cluster-client-ip'];
  }

  if (request.headers['x-forwarded']) {
    return request.headers['x-forwarded'];
  }

  if (request.headers['forwarded-for']) {
    return request.headers['forwarded-for'];
  }

  if (request.headers.forwarded) {
    return request.headers.forwarded;
  }

  if (request.connection) {
    if (request.connection.remoteAddress) {
      return request.connection.remoteAddress;
    }

    if (request.connection.socket && request.connection.socket.remoteAddress) {
      return request.connection.socket.remoteAddress;
    }
  }

  if (request.socket && request.socket.remoteAddress) {
    return request.socket.remoteAddress;
  }

  if (request.info && request.info.remoteAddress) {
    return request.info.remoteAddress;
  }

  if (request.requestContext && request.requestContext.identity && request.requestContext.identity.sourceIp) {
    return request.requestContext.identity.sourceIp;
  }

  return '';
};

module.exports = getClientIp;
