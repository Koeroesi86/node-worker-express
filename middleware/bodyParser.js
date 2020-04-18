const bodyParser = (config = { limitRequestBody: 1000000 }) => (request, response, next) => {
  let body = '';
  request.on('data', data => {
    body += data;

    // Too much POST data, kill the connection!
    // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
    if (body.length > (config.limitRequestBody || 1000000)) {
      body = "";
      response.writeHead(413, { 'Content-Type': 'text/plain' });
      response.end();
      request.connection.destroy();
      // next();
    }
  });
  request.on('end', () => {
    request.body = body;
    next();
  });
};

module.exports = bodyParser;
