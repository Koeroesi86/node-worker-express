import { Request } from 'express';

const getClientIp = (request: Request) => {
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

  if (request.socket && request.socket.remoteAddress) {
    return request.socket.remoteAddress;
  }

  return '';
};

export default getClientIp;
