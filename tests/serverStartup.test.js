const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const listenWithPortFallback = require('../src/utils/serverStartup');

test('falls back to the next available port when the requested port is busy', async () => {
  const blocker = http.createServer();
  await new Promise((resolve) => blocker.listen(0, resolve));

  const occupiedPort = blocker.address().port;
  const server = http.createServer();
  let actualPort = null;

  await new Promise((resolve, reject) => {
    listenWithPortFallback(
      server,
      occupiedPort,
      (port) => {
        actualPort = port;
        server.close(() => {
          blocker.close(() => resolve());
        });
      },
      (error) => {
        blocker.close(() => reject(error));
      },
      { warn: () => {} }
    );
  });

  assert.ok(actualPort !== occupiedPort, 'expected the fallback to move to a different port');
});
