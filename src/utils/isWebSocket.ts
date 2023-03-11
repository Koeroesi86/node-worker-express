import { Request } from 'express';

const isWebSocket = (request: Request) => {
  if (request.method !== 'GET') return false;

  const connection = request.headers.connection || '';
  const upgrade = request.headers.upgrade || '';

  return request.method === 'GET' && connection.toLowerCase().split(/ *, */).indexOf('upgrade') >= 0 && upgrade.toLowerCase() === 'websocket';
};

export default isWebSocket;
