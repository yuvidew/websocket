import express from "express";
import { matchRouter } from "./routes/matches.route";

const app = express();
const PORT = 8000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Hello from Express + TypeScript!");
});

app.use("/matches", matchRouter)

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
