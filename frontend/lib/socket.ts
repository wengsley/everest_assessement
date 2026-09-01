"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getToken } from "@/lib/api";
import type { LevelReport, ResourceAnalytics, UsageRecord } from "@/lib/types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type ReportSnapshot = {
  byLevel: LevelReport[];
  resources: ResourceAnalytics[];
  highDemand: ResourceAnalytics[];
};

export function useCrewSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const next = io(API, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    const onConnect = () => setLive(true);
    const onDisconnect = () => setLive(false);

    next.on("connect", onConnect);
    next.on("disconnect", onDisconnect);
    setSocket(next);

    return () => {
      next.off("connect", onConnect);
      next.off("disconnect", onDisconnect);
      next.disconnect();
      setSocket(null);
      setLive(false);
    };
  }, []);

  return { socket, live };
}

export function mergeActivity(
  current: UsageRecord[],
  record: UsageRecord,
  limit = 500,
): UsageRecord[] {
  const exists = current.some((event) => event.id === record.id);
  if (exists) {
    return current.map((event) => (event.id === record.id ? record : event));
  }
  return [record, ...current].slice(0, limit);
}
