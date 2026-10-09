import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

/**
 * 0: Connecting
 * 1: Open (The only state where you can safely .send())
 * 2: Closing
 * 3: Closed
 */

// Connection Event
wss.on("connection", (socket, request) => {
  const ip = request.socket.remoteAddress;

  socket.on("message", (rawData) => {
    const message = rawData.toString();
    console.log({rawData})

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(`Server Broadcast: ${message}`);
    })
  })


  socket.on("error", (err) => {
    console.error(`Error: ${err.message}: ${ip}`);
  })

  socket.on("close", () => {
    console.log("Client disconnected");
  })
});

console.log("WebSocket server listening on ws://localhost:8080");
