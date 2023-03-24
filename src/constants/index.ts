import path from 'path';
import { MiddlewareOptions } from '../types';

export enum WORKER_EVENT {
  REQUEST = 'WORKER_REQUEST',
  REQUEST_ACKNOWLEDGE = 'WORKER_REQUEST_ACK',
  RESPONSE = 'WORKER_RESPONSE',
  RESPONSE_EMIT = 'WORKER_RESPONSE_EMIT',
  RESPONSE_ACKNOWLEDGE = 'WORKER_RESPONSE_ACK',
  WS_MESSAGE_RECEIVE = 'WS_MESSAGE_RECEIVE',
  WS_MESSAGE_SEND = 'WS_MESSAGE_SEND',
  WS_CONNECTION_CLOSE = 'WS_CONNECTION_CLOSE',
  WS_CONNECTION_CLOSE_ACKNOWLEDGE = 'WS_CONNECTION_CLOSE_ACK',
}

export const ForbiddenPaths: readonly string[] = ['..'] as const;

export enum Protocols {
  http = 'HTTP',
  websocket = 'WS',
}

export const DefaultOptions: MiddlewareOptions = {
  root: '',
  limit: 0,
  limitPerPath: 0,
  limitRequestBody: 1000000,
  limitRequestTimeout: 5000,
  idleCheckTimeout: 5,
  onStdout: () => {},
  onStderr: () => {},
  onExit: () => {},
  onForbiddenPath: (request, response) => {
    response.writeHead(500, { 'Content-Type': 'text/plain' });
    response.end();
    request.connection.destroy();
    throw new Error('Forbidden path');
  },
  index: [],
  env: {},
  staticWorker: path.resolve(__dirname, './staticWorker.js'),
  cwd: process.cwd(),
};
