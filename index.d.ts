type MiddlewareOptions = {
  root: string,
  limit?: number,
  limitPerPath?: number|((path: string) => number),
  limitRequestBody?: number,
  idleCheckTimeout?: number,
  onStdout?: (data: Buffer) => void,
  onStderr?: (data: Buffer) => void,
  onExit?: void,
  index?: string[],
  env?: object,
  staticWorker?: string,
  cwd?: string,
}

declare module '@koeroesi86/node-worker-express' {
  export function middleware(options: MiddlewareOptions): (request: any, response: any, next: void) => void;
}
