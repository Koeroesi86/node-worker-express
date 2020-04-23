module.exports = (event, callback = () => {}) => {
  console.log(event);
  callback({
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=0',
    },
    body: `
    <!DOCTYPE html>
    <html>
      <head>
        <title>It ${process.env.EXAMPLE}!</title>
      </head>
      <body>
        <h1>It ${process.env.EXAMPLE}!</h1>
        <p id="time"></p>
        <script type="text/javascript">
          (function() {
            var timeHolder = document.getElementById('time');
            function connect() {
              var w = new WebSocket('ws://' + window.location.host + '/websocket');
              w.addEventListener('message', e => {
                var d = JSON.parse(e.data);
                var now = new Date(d.now);
                timeHolder.innerHTML = "Server time is " + now.toLocaleTimeString();
                w.send(JSON.stringify({ received: true }));
              });
              w.addEventListener('close', function () {
                setTimeout(function() {
                  location.reload();
                }, 5000);
              });
            }
            // TODO: fix
            connect();
          })();
        </script>
      </body>
    </html>`,
    isBase64Encoded: false,
  });
};
