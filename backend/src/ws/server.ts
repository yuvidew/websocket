import type { Server } from "http";
import type { Match } from "../db/schema";
import { WebSocketServer, WebSocket } from "ws";
import { wsArcjet } from "../arcjet";

/**
 * 0: Connecting
 * 1: Open (The only state where you can safely .send())
 * 2: Closing
 * 3: Closed
 */

type AliveSocket = WebSocket & { isAlive?: boolean };

const sendJson = (socket: WebSocket, payload: unknown) => {
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(payload));
};

// send data to every connected user
const broadcast = (wss: WebSocketServer, payload: unknown) => {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;

    client.send(JSON.stringify(payload));
  }
};

export const attachWebSocketServer = (server: Server) => {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  // Connection Event
  wss.on("connection", async (ws, req) => {

    const socket = ws as AliveSocket;

    if (wsArcjet) {
      try {
        const decision = await wsArcjet.protect(req);

        if (decision.isDenied()) {
          const code = decision.reason.isRateLimit() ? 1013 : 1008;
          const reason = decision.reason.isRateLimit() ? "Rate limit exceeded" : "Access denied";

          socket.close(code, reason);
          return;
        };
      } catch (error) {
        console.log("Ws connecton error", error);
        socket.close(1011, "Server security error");
        return;
      }
    }
    socket.isAlive = true;
    socket.on("pong", () => { socket.isAlive = true });

    sendJson(socket, { type: "welcome" })

    socket.on("error", console.error);
  });

  const interval = setInterval(() => {
    wss.clients.forEach((client) => {
      const ws = client as AliveSocket;
      if (ws.isAlive === false) return ws.terminate();

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval))

  const broadcastMatchCreated = (match: Match) => {
    broadcast(wss, { type: "match_created", data: match })
  }


  return { broadcastMatchCreated };
};
