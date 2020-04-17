const middleware = require('../middleware');
const express = require('express');
const path = require('path');

const app = express();
const port = 8000;
const host = 'localhost';

app.use(middleware({
  root: path.resolve(__dirname, '../examples/public'),
  limit: 1,
  index: [
    'worker.js'
  ],
  env: {
    EXAMPLE: 'works',
  },
  onStdout: (data) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${data.toString().trim()}`);
  },
  onStderr: (data) => {
    console.error(`[${new Date().toLocaleTimeString()}] ${data.toString().trim()}`);
  },
}));

app.listen(port, host, () => {
  console.log(`Server running on http://${host}:${port}`);
});

