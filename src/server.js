import net from "net";
import "dotenv/config";
import loggerFn from "./logger.js";
import { parseCommand, executeCommand } from "./core.js";

const logger = loggerFn("server");

const server = net.createServer();
const port = process.env.PORT || 6379;
const host = process.env.HOST || "127.0.0.1";

server.on("connection", (socket) => {
  socket.on("data", (data) => {
    let response;
    const requestData = data.toString().trim();
    logger.log(requestData);
    const { command, args } = parseCommand(requestData);
    response = executeCommand(command, args);
    logger.log(response);
    socket.write(response);
  });

  socket.on("end", () => {
    logger.log("Client disconnected");
  });

  socket.on("error", (err) => {
    logger.log("Socket error:", err);
  });
});

server
  .listen(port, host, () => {
    logger.log(`Server running at ${host}:${port}`);
  })
  .on("error", (err) => {
    logger.log("Error starting server:", err);
  })
  .on("close", () => {
    logger.log("Server closed");
  });
