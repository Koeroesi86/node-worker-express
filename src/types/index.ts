import { WORKER_EVENT } from '../constants';
import { Request, Response } from 'express';

export type RequestEvent = {
  httpMethod: string;
  protocol: string;
  path: string;
  pathFragments: string[];
  queryStringParameters: { [key: string]: string };
  headers: { [key: string]: string };
  remoteAddress: string;
  body: string;
  rootPath: string;
  closed?: boolean;
  frame?: string;
};

export type WorkerInputEvent = {
  type: string;
  requestId: string;
  event?: RequestEvent;
};

export type WorkerOutputEvent =
  | {
      type: Exclude<WORKER_EVENT, WORKER_EVENT.WS_MESSAGE_SEND>;
      requestId: string;
      event?: ResponseEvent;
    }
  | {
      type: WORKER_EVENT.WS_MESSAGE_SEND;
      requestId: string;
      event?: WSFrameEvent;
    };

export type ResponseEvent = {
  statusCode: number;
  headers?: { [key: string]: string };
  isBase64Encoded?: boolean;
  emit?: boolean;
  body?: string;
};

export type WSFrameEvent = {
  sendWsMessage: boolean;
  frame: string;
};

export type InvokableWorker = (event: RequestEvent, callback: (e: ResponseEvent) => void) => unknown;

export interface MiddlewareOptions {
  root: string;
  limit?: number;
  limitPerPath?: number | ((path: string) => number);
  limitRequestBody?: number;
  limitRequestTimeout?: number;
  idleCheckTimeout?: number;
  onStdout?: (data: Buffer) => void;
  onStderr?: (data: Buffer) => void;
  onExit?: (code: number, workerPath: string, id: string) => void;
  onForbiddenPath: (request: Request, response: Response) => unknown;
  index?: string[];
  env?: object;
  staticWorker?: string;
  cwd?: string;
}
