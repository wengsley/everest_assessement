/**
 * Socket.IO crew room for live activity and report updates.
 * @author wengsley
 */

import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { ROLE_KEY } from "./catalog.js";
import { verifyToken } from "../middleware/auth.js";
import { serializeUsageEvent, type UsageAccess } from "./serialize.js";
import { getReportSnapshot } from "../services/reportsService.js";

let io: Server | null = null;

export function initRealtime(server: HttpServer, origins: string[]) {
  io = new Server(server, {
    cors: { origin: origins },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (typeof token !== "string" || token.length === 0) {
      next(new Error("Authentication required"));
      return;
    }

    try {
      const auth = verifyToken(token);
      if (auth.role !== ROLE_KEY.CREW_LEAD) {
        next(new Error("Crew Lead access required"));
        return;
      }
      socket.data.auth = auth;
      next();
    } catch {
      next(new Error("Invalid or expired session"));
    }
  });

  io.on("connection", (socket) => {
    socket.join("crew");
  });
}

export function emitActivity(event: UsageAccess) {
  io?.to("crew").emit("activity:upsert", serializeUsageEvent(event));
}

/** Push a fresh report snapshot to connected Crew Leads. */
export async function emitReports() {
  if (!io) return;
  io.to("crew").emit("reports:update", await getReportSnapshot());
}

/** Broadcast a usage event and refresh crew reports. */
export async function emitLiveUsage(event: UsageAccess) {
  emitActivity(event);
  await emitReports();
}
