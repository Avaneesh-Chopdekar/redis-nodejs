import net from "net";
import "dotenv/config";
import loggerFn from "./logger.js";
import { parseCommand, executeCommand, init } from "./core.js";

const logger = loggerFn("server");

const server = net.createServer();
const port = process.env.PORT || 6379;
const host = process.env.HOST || "127.0.0.1";

server.on("connection", (socket) => {
  socket.on("data", (data) => {
    let response;
    const requestData = data.toString().trim();
    logger.info(requestData);
    const { command, args } = parseCommand(requestData);
    response = executeCommand(command, args);
    logger.info(response);
    socket.write(response);
  });

  socket.on("end", () => {
    logger.info("Client disconnected");
  });

  socket.on("error", (err) => {
    logger.info("Socket error:", err);
  });
});

server
  .listen(port, host, () => {
    init();

    logger.info(`Server running at ${host}:${port}`);
  })
  .on("error", (err) => {
    logger.info("Error starting server:", err);
  })
  .on("close", () => {
    logger.info("Server closed");
  });
