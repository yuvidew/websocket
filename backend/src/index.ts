import express from "express";
import { matchRouter } from "./routes/matches.route";
import http from "http";
import { attachWebSocketServer } from "./ws/server";
import { securityMiddleware } from "./arcjet";
import { commentaryRouter } from "./routes/commentary.route";

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || "0.0.0.0";

const app = express();
const server = http.createServer(app);

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Hello from Express + TypeScript!");
});

app.use(securityMiddleware());

app.use("/matches", matchRouter);
app.use("/matches/:id/commentary", commentaryRouter);

const { broadcastMatchCreated, broadcastCommemtary } = attachWebSocketServer(server);

app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommemtary = broadcastCommemtary;

server.listen(PORT, HOST, () => {
  const baseUrl = HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  
  console.log(`Server running on ${baseUrl}`);
  console.log(`WebSocket Server is running on ${baseUrl.replace('http', 'ws')}/ws`);

});
