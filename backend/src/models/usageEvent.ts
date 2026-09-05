/**
 * Prisma queries for resource usage events.
 * @author wengsley
 */

import { USAGE_OUTCOME } from "../utils/status.js";
import { usageAccessInclude } from "./includes.js";
import { prisma } from "./prisma.js";

/** Insert a usage event with passenger, resource, and outcome. */
export async function createUsageEvent(data: {
  passengerId: string;
  resourceId: string;
  outcome: string;
}) {
  return prisma.usageEvent.create({
    data,
    include: usageAccessInclude,
  });
}

/** List a passenger's usage events, newest first. */
export async function listUsageByPassenger(passengerId: string) {
  return prisma.usageEvent.findMany({
    where: { passengerId },
    include: usageAccessInclude,
    orderBy: { startedAt: "desc" },
  });
}

/** List a passenger's allowed sessions that are still open. */
export async function listOpenAllowedUsageByPassenger(passengerId: string) {
  return prisma.usageEvent.findMany({
    where: {
      passengerId,
      outcome: USAGE_OUTCOME.ALLOWED,
      endedAt: null,
    },
    include: usageAccessInclude,
    orderBy: { startedAt: "desc" },
  });
}

/** Find a usage event by id. */
export async function findUsageById(id: string) {
  return prisma.usageEvent.findUnique({ where: { id } });
}

/** Set endedAt on a usage event to now. */
export async function endUsageById(id: string) {
  return prisma.usageEvent.update({
    where: { id },
    data: { endedAt: new Date() },
    include: usageAccessInclude,
  });
}

/** List the latest usage events up to the given take. */
export async function listRecentUsage(take: number) {
  return prisma.usageEvent.findMany({
    include: usageAccessInclude,
    orderBy: { startedAt: "desc" },
    take,
  });
}
