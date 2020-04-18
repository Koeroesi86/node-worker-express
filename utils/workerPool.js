const { v4: uuid } = require('uuid');
const path = require('path');
const Worker = require('@koeroesi86/node-worker');

const workerInstances = {};

function getOverallCount() {
  return Object.keys(workerInstances).reduce((result, current) => Object.keys(workerInstances[current]).length + result, 0);
}

function getNonBusyId(workerPath) {
  return Object.keys(workerInstances[workerPath] || {}).find(id => {
    return !workerInstances[workerPath][id].busy;
  });
}

process.once('exit', () => {
  Object.keys(workerInstances).forEach(workerPath => {
    const workerInstance = workerInstances[workerPath];
    Object.keys(workerInstance).forEach(id => {
      if (workerInstance[id]) workerInstance[id].terminate();
    })
  });
});

const createWorkerCommand = workerPath => `node ${path.resolve(__dirname, '../middleware/workerInvoke.js')} ${workerPath}`;

class WorkerPool {
  constructor({ overallLimit = 0, idleCheckTimeout = 5, onExit = () => {} }) {
    this.overallLimit = overallLimit;
    this.idleCheckTimeout = idleCheckTimeout;
    this.onExit = onExit;

    this._creating = false;

    this.getWorker = this.getWorker.bind(this);
  }

  getWorker(workerPath, options = {}, limit = 0) {
    const nonBusyId = getNonBusyId(workerPath);
    // TODO: tidy up
    if (nonBusyId !== undefined) {
      return Promise.resolve(workerInstances[workerPath][nonBusyId]);
    } else if (
      (workerInstances[workerPath] && limit > 0 && Object.keys(workerInstances[workerPath]).length >= limit)
      || (this.overallLimit > 0 && getOverallCount() >= this.overallLimit)
      || this._creating
    ) {
      return Promise.resolve()
        .then(() => new Promise(r => setTimeout(r, this.idleCheckTimeout)))
        .then(() => this.getWorker(workerPath, options, limit));
    } else if (!workerInstances[workerPath]) {
      this._creating = true;
      return Promise.resolve()
        .then(() => {
          const id = uuid();
          const instance = new Worker(createWorkerCommand(workerPath), options);

          instance.addEventListenerOnce('close', code => {
            this.onExit(code, workerPath, id);
          });
          workerInstances[workerPath] = {
            ...(workerInstances[workerPath] && workerInstances[workerPath]),
            [id]: instance,
          };
          instance.addEventListenerOnce('close', () => {
            delete workerInstances[workerPath][id];
          });

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
