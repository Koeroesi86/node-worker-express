# Node Worker Express [![Build status](https://travis-ci.com/Koeroesi86/node-worker-express.svg?branch=master)](https://travis-ci.org/Koeroesi86/node-worker-express)

Express JS library for [@koeroesi86/node-worker](https://www.npmjs.com/package/@koeroesi86/node-worker)

Usage:
```javascript
const { middleware } = require('@koeroesi86/node-worker-express');
const express = require('express');
const path = require('path');

const app = express();
app.use(middleware({ root: path.resolve('./public') }));
app.listen(80);
```

### To run the example included:
```bash
yarn install
yarn start
```

For all options see [types](./index.d.ts).
