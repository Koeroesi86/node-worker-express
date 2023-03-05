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
  }

  export type WorkerInputEvent = {
    type: string;
    requestId: string;
    event?: RequestEvent;
  }

  export type WorkerOutputEvent = {
    type: string;
    requestId: string;
    event?: ResponseEvent|WSFrameEvent;
  }

  export type ResponseEvent = {
    statusCode: number;
    headers?: { [key: string]: string };
    isBase64Encoded?: boolean;
    emit?: boolean;
    body?: string;
  }

  export type WSFrameEvent = {
    sendWsMessage: boolean;
    frame: string;
  }

  export type InvokableWorker = (event: RequestEvent, callback: (e: ResponseEvent) => void) => void;
