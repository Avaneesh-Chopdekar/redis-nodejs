import loggerFn from "./logger.js";

const logger = loggerFn("core");

export const parseCommand = (data) => {
  if (!data) {
    logger.error("No data received");
    return null;
  }
  const lines = data.split("\r\n").filter((line) => line.trim() !== "");

  const command = lines[2].toUpperCase();
  const args = lines.slice(4).filter((_, index) => index % 2 === 0);

  //   logger.log(command);
  //   logger.log(args);
  //   logger.log(lines);

  return { command, args };
};

const commandHandlers = {
  PING: () => "+PONG\r\n",
  COMMAND: () => "+OK\r\n",
  INFO: () => "+OK\r\n",
  SET: () => {
    // implementation for SET command
    return "+OK\r\n";
  },
  GET: (key) => {
    // implementation for GET command
    return `$${key.length}\r\n${key}\r\n`;
  },
};

export const executeCommand = (command, args) => {
  if (!command) {
    logger.error("No command provided");
    return "-ERR no command\r\n";
  }
  const handler = commandHandlers[command];
  if (!handler) {
    logger.error(`Unknown command: ${command}`);
    return "-ERR unknown command\r\n";
  }

  return handler(args);
};
