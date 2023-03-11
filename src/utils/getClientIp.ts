import { Request } from 'express';

const headerToString = (header: string | string[]) => (typeof header === 'string' ? header : header[0]);

const getClientIp = (request: Request): string => {
  if (request.headers['x-client-ip']) {
    return headerToString(request.headers['x-client-ip']);
  }

  if (request.headers['x-forwarded-for']) {
    return headerToString(request.headers['x-forwarded-for']);
  }

  if (request.headers['cf-connecting-ip']) {
    return headerToString(request.headers['cf-connecting-ip']);
  }

  if (request.headers['fastly-client-ip']) {
    return headerToString(request.headers['fastly-client-ip']);
  }

  if (request.headers['true-client-ip']) {
    return headerToString(request.headers['true-client-ip']);
  }

  if (request.headers['x-real-ip']) {
    return headerToString(request.headers['x-real-ip']);
  }

  if (request.headers['x-cluster-client-ip']) {
    return headerToString(request.headers['x-cluster-client-ip']);
  }

  if (request.headers['x-forwarded']) {
    return headerToString(request.headers['x-forwarded']);
  }

  if (request.headers['forwarded-for']) {
    return headerToString(request.headers['forwarded-for']);
  }

  if (request.headers.forwarded) {
    return request.headers.forwarded;
  }

  if (request.socket && request.socket.remoteAddress) {
    return request.socket.remoteAddress;
  }

  return '';
};

export default getClientIp;
