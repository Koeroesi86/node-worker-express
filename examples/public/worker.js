module.exports = (event, callback = () => {}) => {
  console.log(event);
  callback({
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=0',
    },
    body: `It ${process.env.EXAMPLE}!`,
    isBase64Encoded: false,
  })
};
