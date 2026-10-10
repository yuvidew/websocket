import type { Server } from "http";
import type { Match } from "../db/schema";
import { WebSocketServer, WebSocket } from "ws";

/**
 * 0: Connecting
 * 1: Open (The only state where you can safely .send())
 * 2: Closing
 * 3: Closed
 */

const sendJson = (socket: WebSocket, payload: unknown) => {
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(payload));
};

// send data to every connected user
const broadcast = (wss: WebSocketServer, payload: unknown) => {
  for (const client of wss.clients) {
    sendJson(client, payload);
  }
};

export const attachWebSocketServer = (server: Server) => {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  // Connection Event
  wss.on("connection", (socket) => {
    sendJson(socket, { type : "welcome"})

    socket.on("error", console.error);
  });

  const broadcastMatchCreated = (match: Match) => {
    broadcast(wss, { type : "match_created", data: match})
  }


  return { broadcastMatchCreated };
};
