import WebSocket from "ws";

// Open 10 sockets at once to trigger the WebSocket rate limit (5 per 2s).
for (let i = 0; i < 10; i++) {
  const ws = new WebSocket("ws://localhost:8000/ws");
  ws.on("open", () => console.log(`Socket ${i} opened`));
  ws.on("message", (data) => console.log(`Socket ${i} got: ${data.toString()}`));
  ws.on("close", (code, reason) => console.log(`Socket ${i} closed: ${code} ${reason.toString()}`));
  ws.on("error", (err) => console.error(`Socket ${i} error:`, err.message));
}
