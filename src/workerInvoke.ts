import { WORKER_EVENT } from './constants';
import { InvokableWorker, ResponseEvent, WorkerInputEvent, WorkerOutputEvent, WSFrameEvent } from './types';

const worker = require(process.argv.pop()) as InvokableWorker;

function messageListener(message: WorkerInputEvent) {
  if (message.type === WORKER_EVENT.REQUEST) {
    process.send({
      type: WORKER_EVENT.REQUEST_ACKNOWLEDGE,
      requestId: message.requestId,
    });
    const callback = (responseEvent: ResponseEvent | WSFrameEvent) => {
      let e: WorkerOutputEvent;

      if ('sendWsMessage' in responseEvent) {
        e = {
          type: WORKER_EVENT.WS_MESSAGE_SEND,
          requestId: message.requestId,
          event: responseEvent,
        };
      } else if ('emit' in responseEvent) {
        e = {
          type: WORKER_EVENT.RESPONSE_EMIT,
          requestId: message.requestId,
          event: responseEvent,
        };
      } else {
        e = {
          type: WORKER_EVENT.RESPONSE,
          requestId: message.requestId,
          event: responseEvent,
        };
      }
      process.send(e);
    };
    worker(message.event, callback);
  }

  if (message.type === WORKER_EVENT.WS_MESSAGE_RECEIVE) {
    const callback = (responseEvent) => {
      const e: WorkerOutputEvent = {
        type: WORKER_EVENT.WS_MESSAGE_SEND,
        requestId: message.requestId,
        event: responseEvent,
      };
      process.send(e);
    };
    worker(message.event, callback);
  }

  if (message.type === WORKER_EVENT.WS_CONNECTION_CLOSE) {
    worker({ ...message.event, closed: true }, (responseEvent: ResponseEvent) => {
      process.send({
        type: WORKER_EVENT.WS_CONNECTION_CLOSE_ACKNOWLEDGE,
        requestId: message.requestId,
        event: responseEvent,
      });
    });
  }
}

process.on('message', messageListener);
