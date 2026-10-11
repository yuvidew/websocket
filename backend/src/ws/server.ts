import type { Server } from "http";
import type { Duplex } from "stream";
import type { Commentary, Match } from "../db/schema";
import { WebSocketServer, WebSocket, type RawData } from "ws";
import { wsArcjet } from "../arcjet";

/**
 * 0: Connecting
 * 1: Open (The only state where you can safely .send())
 * 2: Closing
 * 3: Closed
 */

type AliveSocket = WebSocket & { isAlive?: boolean; subscriptions: Set<number> };

// Maps each matchId to the set of sockets subscribed to that match's updates
const matchSubscribers = new Map<number, Set<WebSocket>>();

// Adds a socket to a match's subscriber set, creating the set if it doesn't exist yet
const subscribe = (socket: WebSocket, matchId: number) => {
  if (!matchSubscribers.has(matchId)) {
    matchSubscribers.set(matchId, new Set());
  }

  matchSubscribers.get(matchId)!.add(socket)
}

const unSubscribe = (socket: WebSocket, matchId: number) => {
  const subscribers = matchSubscribers.get(matchId);

  if (!subscribers) return;

  subscribers.delete(socket)

  if (subscribers.size === 0) {
    matchSubscribers.delete(matchId)
  }
}

const cleanupSubscriptions = (socket: AliveSocket) => {
  for (const matchId of socket.subscriptions) {
    unSubscribe(socket, matchId)
  }
}


const sendJson = (socket: WebSocket, payload: unknown) => {
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(payload));
};

// Reject a WebSocket handshake with a plain HTTP error response, then drop the raw socket
const rejectUpgrade = (socket: Duplex, status: number, message: string) => {
  socket.write(
    `HTTP/1.1 ${status} ${message}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`
  );
  socket.destroy();
};

// send data to every connected user
const broadcastToAll = (wss: WebSocketServer, payload: unknown) => {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;

    client.send(JSON.stringify(payload));
  }
};

const broadCastToMatch = (matchId: number, payload: unknown) => {
  const subscribers = matchSubscribers.get(matchId);
  if(!subscribers || subscribers.size === 0) return;

  const message = JSON.stringify(payload);

  for (const client of subscribers) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

const handleMessage = (socket: AliveSocket, data: RawData) => {
  let message;

  try {
    message = JSON.parse(data.toString());
  } catch {
    sendJson(socket, { type : "error", message : "Invalid JSON" });
    return;
  }

  if (message?.type === "subscribe" && Number.isInteger(message.matchId)) {
    subscribe(socket, message.matchId);
    socket.subscriptions.add(message.matchId);
    sendJson(socket, { type : "subscribed", matchId : message.matchId });
    return;
  }

  if (message?.type === "unsubscribe" && Number.isInteger(message.matchId)) {
    unSubscribe(socket, message.matchId);
    socket.subscriptions.delete(message.matchId);
    sendJson(socket, { type : "unSubscribed", matchId : message.matchId });
    return;
  }


}

export const attachWebSocketServer = (server: Server) => {
  // noServer: we handle the HTTP "upgrade" ourselves so Arcjet can reject before the handshake
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 1024 * 1024,
  });

  server.on("upgrade", async (req, socket, head) => {
    const { pathname } = new URL(req.url ?? "", "http://localhost");

    if (pathname !== "/ws") {
      rejectUpgrade(socket, 404, "Not Found");
      return;
    }

    if (wsArcjet) {
      try {
        const decision = await wsArcjet.protect(req);

        if (decision.isDenied()) {
          if (decision.reason.isRateLimit()) {
            rejectUpgrade(socket, 429, "Too Many Requests");
          } else {
            rejectUpgrade(socket, 403, "Forbidden");
          }
          return;
        }
      } catch (error) {
        console.log("Ws upgrade error", error);
        rejectUpgrade(socket, 500, "Internal Server Error");
        return;
      }
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  server.on("close", () => wss.close());

  // Connection Event
  wss.on("connection", (ws) => {

    const socket = ws as AliveSocket;

    socket.isAlive = true;
    socket.on("pong", () => { socket.isAlive = true });

    socket.subscriptions = new Set();

    sendJson(socket, { type: "welcome" });

    socket.on("message", (data) => {
      handleMessage(socket, data);
    });

    socket.on("error", () => {
      socket.terminate();
    });

    socket.on("close", () => {
      cleanupSubscriptions(socket);
    });

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
    broadcastToAll(wss, { type: "match_created", data: match })
  }

  const broadcastCommemtary = (matchId: number, comment: Commentary) => {
    broadCastToMatch(matchId, { type: "commentary", data: comment })
  }

  return { broadcastMatchCreated, broadcastCommemtary };
};
