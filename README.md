> **⚠️ This repository has moved.** `@koeroesi86/node-worker-express` is now developed in the [node-webserver monorepo](https://github.com/Koeroesi86/node-webserver), in [`packages/node-worker-express`](https://github.com/Koeroesi86/node-webserver/tree/master/packages/node-worker-express). This repository is no longer maintained, please open issues and pull requests there.

# Node Worker Express [![Publish](https://github.com/Koeroesi86/node-worker-express/actions/workflows/publish.yml/badge.svg)](https://github.com/Koeroesi86/node-worker-express/actions/workflows/publish.yml)

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

For all options see [types](https://github.com/Koeroesi86/node-worker-express/blob/main/src/middleware/index.ts).
