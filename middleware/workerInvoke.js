const { WORKER_EVENT } = require('../constants');

const worker = require(process.argv[2]);
process.on('message', message => {
  if (message.type === WORKER_EVENT.REQUEST)  {
    process.send({
      type: WORKER_EVENT.REQUEST_ACKNOWLEDGE,
      requestId: message.requestId,
    });
    const callback = responseEvent => {
      if (responseEvent.sendWsMessage) {
        process.send({
          type: WORKER_EVENT.WS_MESSAGE_SEND,
          requestId: message.requestId,
          event: responseEvent,
        });
      } else {
        process.send({
          type: WORKER_EVENT.RESPONSE,
          requestId: message.requestId,
          event: responseEvent,
        });
      }
    };
    worker(message.event, callback);
  }
  if (message.type === WORKER_EVENT.WS_CONNECTION_CLOSE) {
    worker({ ...message.event, closed: true }, responseEvent => {
      process.send({
        type: WORKER_EVENT.WS_CONNECTION_CLOSE_ACKNOWLEDGE,
        requestId: message.requestId,
        event: responseEvent,
      });
    });
  }
});
