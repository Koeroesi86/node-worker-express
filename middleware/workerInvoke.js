const { WORKER_EVENT } = require('../constants');

/** @namespace Middleware */

/** @type {InvokableWorker} worker */
const worker = require(process.argv[2]);

/** @type {WorkerInputEvent} message */
function messageListener(message) {
  if (message.type === WORKER_EVENT.REQUEST)  {
    process.send({
      type: WORKER_EVENT.REQUEST_ACKNOWLEDGE,
      requestId: message.requestId,
    });
    const callback = responseEvent => {
      /** @type {WorkerOutputEvent} e */
      const e = {
        type: responseEvent.sendWsMessage ? WORKER_EVENT.WS_MESSAGE_SEND : WORKER_EVENT.RESPONSE,
        requestId: message.requestId,
        event: responseEvent,
      }
      process.send(e);
    };
    worker(message.event, callback);
  }
  if (message.type === WORKER_EVENT.WS_CONNECTION_CLOSE) {
    /** @type {ResponseEvent} responseEvent */
    worker({ ...message.event, closed: true }, responseEvent => {
      process.send({
        type: WORKER_EVENT.WS_CONNECTION_CLOSE_ACKNOWLEDGE,
        requestId: message.requestId,
        event: responseEvent,
      });
    });
  }
}

process.on('message', messageListener);
