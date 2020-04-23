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

declare namespace Middleware {
  type RequestEvent = {
    httpMethod: string;
    protocol: string;
    path: string;
    pathFragments: string[];
    queryStringParameters: { [key: string]: string };
    headers: { [key: string]: string };
    remoteAddress: string;
    body: string;
    rootPath: string;
  }

  type WorkerInputEvent = {
    type: string;
    requestId: string;
    event?: RequestEvent;
  }

  type WorkerOutputEvent = {
    type: string;
    requestId: string;
    event?: ResponseEvent|WSFrameEvent;
  }

  type ResponseEvent = {
    statusCode: number;
    headers?: { [key: string]: string };
    isBase64Encoded?: boolean;
    body?: string;
  }

  type WSFrameEvent = {
    sendWsMessage: boolean;
    frame: string;
  }

  function InvokableWorker(event: RequestEvent, callback: (e: ResponseEvent) => void): void;
}

declare module '@koeroesi86/node-worker-express' {
  import { RequestHandler } from "express";

  export function middleware(options: MiddlewareOptions): RequestHandler;
}
