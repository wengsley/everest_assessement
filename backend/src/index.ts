/**
 * Express app entry: HTTP server, CORS, API routes, and Socket.IO.
 * @author wengsley
 */

import "dotenv/config";
import { createServer } from "http";
import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errors.js";
import { initRealtime } from "./utils/realtime.js";
import { fail, ok } from "./utils/response.js";
import { authRouter } from "./routes/auth.js";
import { crewLeadsRouter } from "./routes/crewLeads.js";
import { passengersRouter } from "./routes/passengers.js";
import { reportsRouter } from "./routes/reports.js";
import { resourcesRouter } from "./routes/resources.js";
import { usageRouter } from "./routes/usage.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
const origins = (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use(cors({ origin: origins }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  ok(res, { service: "x26-prms" });
});

app.use("/api/auth", authRouter);
app.use("/api/crew-leads", crewLeadsRouter);
app.use("/api/passengers", passengersRouter);
app.use("/api/resources", resourcesRouter);
app.use("/api/usage", usageRouter);
app.use("/api/reports", reportsRouter);

app.use((_req, res) => {
  fail(res, 404, "Not found");
});

app.use(errorHandler);

const server = createServer(app);
initRealtime(server, origins);

server.listen(port, () => {
  console.log(`X26 PRMS API listening on http://localhost:${port}`);
});
