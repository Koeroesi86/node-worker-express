import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs';
import url from 'url';
import { WORKER_EVENT } from '../constants';
import WorkerPool from '../utils/workerPool';
import isWebSocket from '../utils/isWebSocket';
import parseWsMessage from '../utils/parseWsMessage';
import constructWsMessage from '../utils/constructWsMessage';
import getClientIp from '../utils/getClientIp';
import createBodyParser from './bodyParser';
import { RequestHandler } from 'express';

type MiddlewareOptions = {
  root: string,
  limit?: number,
  limitPerPath?: number|((path: string) => number),
  limitRequestBody?: number,
  limitRequestTimeout?: number,
  idleCheckTimeout?: number,
  onStdout?: (data: Buffer) => void,
  onStderr?: (data: Buffer) => void,
  onExit?: void,
  index?: string[],
  env?: object,
  staticWorker?: string,
  cwd?: string,
}

const ForbiddenPaths = [
  '..'
];

const Protocols = {
  http: 'HTTP',
  websocket: 'WS',
};

const DefaultOptions = {
  root: null,
  limit: 0,
  limitPerPath: 0,
  limitRequestBody: 1000000,
  limitRequestTimeout: 5000,
  idleCheckTimeout: 5,
  onStdout: () => {
  },
  onStderr: () => {
  },
  onExit: () => {
  },
  onForbiddenPath: (request, response) => {
    response.writeHead(500, { 'Content-Type': 'text/plain' });
    response.end();
    request.connection.destroy();
  },
  index: [],
  env: {},
  staticWorker: path.resolve(__dirname, './staticWorker.js'),
  cwd: process.cwd(),
};

const workerMiddleware = (options: MiddlewareOptions): RequestHandler => {
  const config = {
    ...DefaultOptions,
    ...(options && options),
  };
  if (!config.root) {
    throw new Error('No root path defined in configuration!');
  }
  const rootPath = path.resolve(config.root);
  const workerPool = new WorkerPool({
    overallLimit: config.limit,
    onExit: config.onExit,
    idleCheckTimeout: config.idleCheckTimeout,
  });
  const bodyParser = createBodyParser({ limitRequestBody: config.limitRequestBody, shouldError: true });
  const aliasCache = {};
  const workerCache = {};

  return async (request, response, next) => {
    const {
      query: queryStringParameters,
      pathname
    } = url.parse(request.url, true);

    try {
      let isWorker = false;
      const pathFragments = pathname.split(/\//gi).filter(Boolean);
      let currentPathFragments = pathFragments.slice(0);
      let pathExists = false;

      await new Promise<void>((resolve, reject) => {
        if (pathFragments.find(p => ForbiddenPaths.includes(p))) {
          config.onForbiddenPath(request, response);
          reject();
        }
        resolve();
      });

      await Promise.race([
        new Promise((res, rej) => setTimeout(rej, config.limitRequestTimeout)),
        new Promise(res => bodyParser(request, response, res)),
      ]);
      let indexPath;

      if (aliasCache[pathname] && fs.existsSync(aliasCache[pathname])) {
        isWorker = true;
        indexPath = aliasCache[pathname];
      } else if (workerCache[pathname] && fs.existsSync(workerCache[pathname])) {
        isWorker = true;
        indexPath = workerCache[pathname];
      } else {
        indexPath = path.join(rootPath, ...currentPathFragments)

        for (let i = currentPathFragments.length; i >= 0 && !pathExists; i--) {
          if (pathExists) continue;
          currentPathFragments.splice(i);
          const currentPath = path.join(rootPath, ...currentPathFragments);
          pathExists = fs.existsSync(currentPath);
          if (!pathExists) continue;
          const currentStats = fs.statSync(currentPath);

          if (pathExists && currentStats.isDirectory()) {
            // index fallback
            pathExists = !!config.index.find(indexFile => {
              const checkIndexFilePath = path.join(currentPath, indexFile);
              if (fs.existsSync(checkIndexFilePath)) {
                isWorker = true;
                indexPath = checkIndexFilePath;
                aliasCache[pathname] = checkIndexFilePath;
                setTimeout(() => {
                  aliasCache[pathname] = null;
                  delete aliasCache[pathname];
                }, 5000);
                return true;
              }
            });
            if (pathExists) break;
          } else if (pathExists && currentStats.isFile()) {
            if (config.index.includes(currentPathFragments[currentPathFragments.length - 1])) {
              isWorker = true;
              workerCache[pathname] = currentPath;
              setTimeout(() => {
                workerCache[pathname] = null;
                delete workerCache[pathname];
              }, 5000);
            }
          }
        }
      }

      /** @type {RequestEvent} */
      const event = {
        httpMethod: request.method.toUpperCase(),
        protocol: isWebSocket(request) ? Protocols.websocket : Protocols.http,
        path: pathname,
        pathFragments: pathFragments,
        queryStringParameters: JSON.parse(JSON.stringify(queryStringParameters)),
        headers: request.headers,
        remoteAddress: getClientIp(request),
        body: `${request.body}`,
        rootPath: rootPath,
      };

      const worker = isWorker ? await workerPool.getWorker(
        indexPath,
        {
          stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ],
          env: { ...process.env, ...config.env },
          cwd: config.cwd,
        },
        typeof config.limitPerPath === "function" ? config.limitPerPath(indexPath) : config.limitPerPath
      ) : await workerPool.getWorker(
        config.staticWorker,
        {
          cwd: process.cwd(),
          stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ],
        },
        1
      );

      const requestId = uuid();

      let firstReceived = false;
      const requestSocketListener = data => {
        const frame = parseWsMessage(data);

        // TODO: filter open frame better
        if (data.length === 8 && !firstReceived) {
          firstReceived = true;
          return;
        }

        firstReceived = true;

        worker.postMessage({
          type: WORKER_EVENT.WS_MESSAGE_RECEIVE,
          requestId,
          event: { ...event, frame }
        });
      };
      if (event.protocol === Protocols.websocket) {
        request.socket.on('data', requestSocketListener);
      }

      worker.instance.stdout.off('data', config.onStdout);
      worker.instance.stdout.on('data', config.onStdout);

      worker.instance.stderr.off('data', config.onStderr);
      worker.instance.stderr.on('data', config.onStderr);

      const messageListener = responseEvent => {
        if (responseEvent.requestId === requestId) {
          if (responseEvent.type === WORKER_EVENT.RESPONSE) {
            worker.postMessage({
              type: WORKER_EVENT.RESPONSE_ACKNOWLEDGE,
              requestId,
            });
            /** @type {ResponseEvent|WSFrameEvent} event */
            const { event } = responseEvent;
            const bufferEncoding = event.isBase64Encoded ? 'base64' : 'utf8';

            response.writeHead(event.statusCode, event.headers);
            response.write(Buffer.from(event.body, bufferEncoding));
            response.end();
          }

          if (responseEvent.type === WORKER_EVENT.RESPONSE_EMIT) {
            worker.postMessage({
              type: WORKER_EVENT.RESPONSE_ACKNOWLEDGE,
              requestId,
            });
            /** @type {ResponseEvent|WSFrameEvent} event */
            const { event } = responseEvent;
            const bufferEncoding = event.isBase64Encoded ? 'base64' : 'utf8';

            if (!response.headersSent) {
              response.writeHead(event.statusCode, event.headers);
            }
            if (event.body !== null) {
              response.write(Buffer.from(event.body, bufferEncoding).toString());
            } else {
              response.end();
            }
          }

          if (responseEvent.type === WORKER_EVENT.WS_MESSAGE_SEND) {
            request.socket.write(constructWsMessage(responseEvent.event.frame));
          }

          if (responseEvent.type === WORKER_EVENT.REQUEST_ACKNOWLEDGE) {
            worker.busy = false;
          }
        }
      };

      const requestCloseListener = () => {
        worker.postMessage({
          type: WORKER_EVENT.WS_CONNECTION_CLOSE,
          requestId,
          event
        });
        if (request.socket && request.socket.off) request.socket.off('close', requestCloseListener);
        worker.removeEventListener('message', messageListener);
      };
      request.socket.on('close', requestCloseListener);

      worker.addEventListener('message', messageListener);
      worker.postMessage({
        type: WORKER_EVENT.REQUEST,
        requestId,
        event,
      });

      const cleanupConnection = () => {
        worker.removeEventListener('message', messageListener);
        if (request && request.off) {
          request.off('close', cleanupConnection);
          request.off('aborted', cleanupConnection);
        }

        if (request.socket && request.socket.off) {
          request.socket.off('data', requestSocketListener);
          request.socket.off('close', requestCloseListener);
        }
      };
      request.on('aborted', cleanupConnection);
      if (event.protocol === Protocols.http) {
        request.on('close', cleanupConnection);
        response.on('finish', cleanupConnection)
      }
    } catch (e) {
      next(e);
    }
  };
};

export default workerMiddleware;
