import net from "net";
import "dotenv/config";

const server = net.createServer();
const port = process.env.PORT || 6379;
const host = process.env.HOST || "127.0.0.1";

server.on("connection", (socket) => {
  socket.on("data", (data) => {
    const request = data.toString().trim();
    socket.write(`Response: ${request}`);
  });

  socket.on("end", () => {
    console.log("Client disconnected");
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });
});

server
  .listen(port, host, () => {
    console.log(`Server running at ${host}:${port}`);
  })
  .on("error", (err) => {
    console.error("Error starting server:", err);
  })
  .on("close", () => {
    console.log("Server closed");
  });
