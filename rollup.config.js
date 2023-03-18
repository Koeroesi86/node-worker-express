const typescript = require('@rollup/plugin-typescript');
const fs = require('fs');
const packageJson = require('./package.json');

/** @type {import('rollup').RollupOptions} */
module.exports = {
  input: fs.readdirSync('./src')
    .filter((file) => file.endsWith('.ts'))
    .map((file) => `./src/${file}`),
  output: {
    dir: './dist',
    format: 'cjs',
    sourcemap: true,
  },
  external: [
    ...Object.keys(packageJson.dependencies || {}),
    'path',
    'fs',
    'fs/promises',
    'crypto',
    'child_process',
    'stream',
    'url',
  ],
  plugins: [typescript()],
};
