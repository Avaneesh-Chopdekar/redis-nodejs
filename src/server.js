import net from "net";
import "dotenv/config";
import loggerFn from "./logger.js";

const logger = loggerFn("server");

const server = net.createServer();
const port = process.env.PORT || 6379;
const host = process.env.HOST || "127.0.0.1";

server.on("connection", (socket) => {
  socket.on("data", (data) => {
    const request = data.toString().trim();
    logger.log(request);

    socket.write("+OK\r\n"); // Respond with a simple OK message
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
