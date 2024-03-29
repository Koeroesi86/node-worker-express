import { v4 as uuid } from 'uuid';
import path from 'path';
import Worker from '@koeroesi86/node-worker';

const pools: WorkerPool[] = [];

process.once('exit', () => {
  pools.forEach((pool) => pool.onClose());
});

const createWorkerCommand = (workerPath) => {
  const ext = path.extname(workerPath);
  switch (ext) {
    case '.js':
    default:
      return `node --expose-gc ${path.resolve(__dirname, './workerInvoke.js')} ${workerPath}`;
  }
};

interface WorkerPoolParams {
  overallLimit?: number;
  idleCheckTimeout?: number;
  onExit?: (code: number, workerPath: string, id: string) => void;
}

class WorkerPool {
  protected readonly overallLimit: number;
  protected readonly idleCheckTimeout: number;
  protected readonly onExit: (code: number, workerPath: string, id: string) => void;
  protected readonly workers: Record<string, Record<string, Worker>>;
  private creating: boolean;

  constructor({ overallLimit = 0, idleCheckTimeout = 5, onExit = () => {} }: WorkerPoolParams) {
    this.overallLimit = overallLimit;
    this.idleCheckTimeout = idleCheckTimeout;
    this.onExit = onExit;
    this.workers = {};
    pools.push(this);

    this.creating = false;
  }

  onClose = () => {
    Object.keys(this.workers).forEach((workerPath) => {
      const current = this.workers[workerPath];
      Object.keys(current).forEach((id) => {
        current[id].terminate();
      });
    });
  };

  getNonBusyId = (workerPath) => {
    return this.workers[workerPath]
      ? Object.keys(this.workers[workerPath] || {}).find((id) => {
          return true; // !this.workers[workerPath][id].busy;
        })
      : undefined;
  };

  getWorkerCountForPath = (p) => {
    return this.workers[p] ? Object.keys(this.workers[p]).length : 0;
  };

  getWorkerCount = () => {
    return Object.keys(this.workers).reduce((result, current) => this.getWorkerCountForPath(current) + result, 0);
  };

  isBeyondLimit = (workerPath, limit) => {
    return (
      (this.workers[workerPath] && limit > 0 && this.getWorkerCountForPath(workerPath) >= limit) ||
      (this.overallLimit > 0 && this.getWorkerCount() >= this.overallLimit)
    );
  };

  getWorker = async (workerPath, options = {}, limit = 0): Promise<Worker> => {
    const nonBusyId = this.getNonBusyId(workerPath);
    // TODO: tidy up
    if (nonBusyId !== undefined) {
      return this.workers[workerPath][nonBusyId];
    } else if (this.isBeyondLimit(workerPath, limit) || this.creating) {
      await new Promise((r) => setTimeout(r, this.idleCheckTimeout));
      return this.getWorker(workerPath, options, limit);
    }

    this.creating = true;
    const id = uuid();
    const instance = new Worker(createWorkerCommand(workerPath), options);

    if (!this.workers[workerPath]) {
      this.workers[workerPath] = {};
    }

    instance.addEventListenerOnce('close', (code: number) => {
      this.workers[workerPath][id] = null;
      delete this.workers[workerPath][id];
      this.onExit(code, workerPath, id);
    });

    this.workers[workerPath][id] = instance;

    this.creating = false;
    return instance;
  };
}

export default WorkerPool;
