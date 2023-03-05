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
};
