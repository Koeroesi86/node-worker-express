const { v4: uuid } = require('uuid');
const path = require('path');
const Worker = require('@koeroesi86/node-worker');

/**
 * @var {WorkerPool[]}
 */
const pools = [];

process.once('exit', () => {
  pools.forEach(pool => pool.onClose());
});

const createWorkerCommand = workerPath => {
  const ext = path.extname(workerPath);
  switch (ext) {
    case '.js':
    default:
      return `node ${path.resolve(__dirname, '../middleware/workerInvoke.js')} ${workerPath}`;
  }
};

class WorkerPool {
  constructor({ overallLimit = 0, idleCheckTimeout = 5, onExit = () => {} }) {
    this.overallLimit = overallLimit;
    this.idleCheckTimeout = idleCheckTimeout;
    this.onExit = onExit;
    this.workers = {};
    pools.push(this);

    this._creating = false;

    this.getWorker = this.getWorker.bind(this);
    this.onClose = this.onClose.bind(this);
    this.getNonBusyId = this.getNonBusyId.bind(this);
    this.getWorkerCount = this.getWorkerCount.bind(this);
  }

  onClose() {
    Object.keys(this.workers).forEach(workerPath => {
      const current = this.workers[workerPath];
      Object.keys(current).forEach(id => {
        current[id].terminate();
      });
    });
  }

  getNonBusyId(workerPath) {
    return Object.keys(this.workers[workerPath] || {}).find(id => {
      return !this.workers[workerPath][id].busy;
    });
  }

  getWorkerCount() {
    return Object.keys(this.workers).reduce((result, current) => Object.keys(this.workers[current]).length + result, 0);
  }

  isBeyondLimit(workerPath, limit) {
    return (this.workers[workerPath] && limit > 0 && Object.keys(this.workers[workerPath]).length >= limit)
      || (this.overallLimit > 0 && this.getWorkerCount() >= this.overallLimit);
  }

  getWorker(workerPath, options = {}, limit = 0) {
    const nonBusyId = this.getNonBusyId(workerPath);
    // TODO: tidy up
    if (nonBusyId !== undefined) {
      return Promise.resolve(this.workers[workerPath][nonBusyId]);
    } else if (this.isBeyondLimit(workerPath, limit) || this._creating) {
      return Promise.resolve()
        .then(() => new Promise(r => setTimeout(r, this.idleCheckTimeout)))
        .then(() => this.getWorker(workerPath, options, limit));
    } else if (!this.workers[workerPath]) {
      this._creating = true;
      return Promise.resolve()
        .then(() => {
          const id = uuid();
          const instance = new Worker(createWorkerCommand(workerPath), options);

          instance.addEventListenerOnce('close', code => {
            delete this.workers[workerPath][id];
            this.onExit(code, workerPath, id);
          });
          this.workers[workerPath] = {
            ...(this.workers[workerPath] && this.workers[workerPath]),
            [id]: instance,
          };

          this._creating = false;
          return Promise.resolve(instance);
        });
    }

    return Promise.resolve()
      .then(() => new Promise(r => setTimeout(r, this.idleCheckTimeout)))
      .then(() => this.getWorker(workerPath, options, limit));
  }
}

module.exports = WorkerPool;
