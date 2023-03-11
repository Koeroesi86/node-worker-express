const typescript = require('@rollup/plugin-typescript');
const packageJson = require('./package.json');

/** @type {import('rollup').RollupOptions} */
module.exports = {
  input: ['./src/index.ts', './src/workerInvoke.ts', './src/staticWorker.ts'],
  output: {
    dir: './dist',
    format: 'cjs',
    sourcemap: true,
  },
  external: [...Object.keys(packageJson.dependencies || {})],
  plugins: [typescript()],
};
