type MiddlewareOptions = {
  root: string,
  limit?: number,
  limitPerPath?: number|((path: string) => number),
  limitRequestBody?: number,
  idleCheckTimeout?: number,
  onStdout?: void,
  onStderr?: void,
  onExit?: void,
  index?: string[],
  env?: object,
  staticWorker?: string,
}

declare module '@koeroesi86/node-worker-express' {
  export function middleware(options: MiddlewareOptions): (request: any, response: any, next: void) => void;
}
