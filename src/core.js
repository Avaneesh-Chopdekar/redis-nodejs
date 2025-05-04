import { parse } from "node:path";
import loggerFn from "./utils/logger.js";

const logger = loggerFn("core");

const store = {};
const expirationTimes = {};

const isExpired = (key) =>
  expirationTimes[key] && expirationTimes[key] < Date.now();

const checkExpiration = (key) => {
  if (isExpired(key)) {
    delete store[key];
    delete expirationTimes[key];

    return true;
  }
  return false;
};

export const parseCommand = (data) => {
  if (!data) {
    logger.error("No data received");
    return null;
  }
  const lines = data.split("\r\n").filter((line) => line.trim() !== "");

  const command = lines[2].toUpperCase();
  const args = lines.slice(4).filter((_, index) => index % 2 === 0);

  //   logger.info(command);
  //   logger.info(args);
  //   logger.info(lines);

  return { command, args };
};

const commandHandlers = {
  PING: () => "+PONG\r\n",
  COMMAND: () => "+OK\r\n",
  INFO: () => "+OK\r\n",
  SET: (args) => {
    if (args.length < 2) {
      logger.error("SET command requires at least 2 arguments");
      return "-ERR wrong number of arguments for 'set' command\r\n";
    }
    const key = args[0];
    const value = args[1];
    store[key] = { type: "string", value };

    return "+OK\r\n";
  },
  GET: (args) => {
    if (args.length < 1) {
      return "-ERR wrong number of arguments for 'get' command\r\n";
    }

    const key = args[0];

    if (checkExpiration(key) || !store[key] || store[key].type !== "string") {
      return "$-1\r\n";
    }

    const value = store[key].value;

    return `$${value.length}\r\n${value}\r\n`;
  },
  DEL: (args) => {
    if (args.length < 1) {
      return "-ERR wrong number of arguments for 'del' command\r\n";
    }

    const [key] = args;

    if (store[key]) {
      delete store[key];
      delete expirationTimes[key];

      return ":1\r\n";
    } else {
      return ":0\r\n";
    }
  },
  EXPIRE: (args) => {
    if (args.length < 2) {
      return "-ERR wrong number of arguments for 'expire' command\r\n";
    }

    const [key, seconds] = args;

    if (!store[key]) return ":0\r\n";

    expirationTimes[key] = Date.now() + seconds * 1000;

    return ":1\r\n";
  },
  TTL: (args) => {
    if (args.length < 1) {
      return "-ERR wrong number of arguments for 'ttl' command\r\n";
    }

    const [key] = args;

    if (!store[key]) return ":-2\r\n";

    if (!expirationTimes[key]) return ":-1\r\n";

    const ttl = Math.floor((expirationTimes[key] - Date.now()) / 1000);

    return ttl > 0 ? `:${ttl}\r\n` : ":-2\r\n";
  },
  INCR: (args) => {
    if (args.length < 1) {
      return "-ERR wrong number of arguments for 'incr' command\r\n";
    }

    const [key] = args;
    if (checkExpiration(key)) {
      return "-ERR key expired\r\n";
    }

    if (!store[key]) {
      store[key] = { type: "string", value: "1" };

      return ":1\r\n";
    }

    const value = parseInt(store[key].value, 10);

    if (isNaN(value)) return "-ERR value is not an integer or out of range\r\n";
    store[key].value = (value + 1).toString();

    return `:${value + 1}\r\n`;
  },
  DECR: (args) => {
    if (args.length < 1) {
      return "-ERR wrong number of arguments for 'decr' command\r\n";
    }

    const [key] = args;

    if (!store[key]) {
      store[key] = { type: "string", value: "-1" };

      return ":-1\r\n";
    }

    const value = parseInt(store[key].value, 10);

    if (isNaN(value)) {
      return "-ERR value is not an integer or out of range\r\n";
    }

    store[key].value = (value - 1).toString();

    return `:${value - 1}\r\n`;
  },
  LPUSH: (args) => {
    if (args.length < 2) {
      return "-ERR wrong number of arguments for 'lpush' command\r\n";
    }

    const [key, ...values] = args;

    if (!store[key]) {
      store[key] = { type: "list", value: [] };
    }

    if (store[key].type !== "list") {
      return "-ERR wrong type of key\r\n";
    }

    store[key].value.unshift(...values);

    return `:${store[key].value.length}\r\n`;
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

export const init = () => {
  logger.info("Persistence mode: 'in-memory'");
};
