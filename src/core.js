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
