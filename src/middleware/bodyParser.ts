import { Request, Response, NextFunction } from 'express';

const ignoredMethods = ['get', 'delete', 'options', 'head'];

const createBodyParser =
  (config = { limitRequestBody: 1000000, shouldError: true }) =>
  (request: Request, response: Response, next: NextFunction) => {
    let body = '';

    if (ignoredMethods.includes(request.method.toLowerCase())) {
      request.body = body;
      next();
      return;
    }

    request.on('data', (data) => {
      body += data;

      // Too much POST data, kill the connection!
      // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
      if (body.length > (config.limitRequestBody || 1000000)) {
        body = '';

        if (config.shouldError) {
          response.writeHead(413, { 'Content-Type': 'text/plain' });
          response.end();
          request.connection.destroy();
        } else {
          next();
        }
      }
    });

    request.on('end', () => {
      request.body = body;
      next();
    });
  };

export default createBodyParser;
