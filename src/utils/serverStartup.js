function listenWithPortFallback(server, basePort, onListen, onError, logger = console) {
  let settled = false;

  const tryPort = (port) => {
    const handleError = (error) => {
      if (settled) {
        return;
      }

      if (error?.code === "EADDRINUSE" && port < 65535) {
        logger.warn(`Port ${port} is busy. Trying ${port + 1}...`);
        tryPort(port + 1);
        return;
      }

      settled = true;
      onError(error);
    };

    server.removeAllListeners("error");
    server.once("error", handleError);
    server.listen(port, () => {
      if (settled) {
        server.close();
        return;
      }

      settled = true;
      onListen(port);
    });
  };

  tryPort(basePort);
}

module.exports = listenWithPortFallback;
