/**
 * Usage history, session end, and crew activity feed.
 * @author wengsley
 */

import { canAccess } from "../utils/access.js";
import { HttpError, notFound } from "../utils/errors.js";
import {
  endUsageById,
  findUsageById,
  listOpenAllowedUsageByPassenger,
  listRecentUsage,
  listUsageByPassenger,
} from "../models/usageEvent.js";
import { emitActivity, emitReports } from "../utils/realtime.js";
import { serializeUsageEvent } from "../utils/serialize.js";
import { USAGE_OUTCOME } from "../utils/status.js";

/** Return all usage events for one passenger. */
export async function getMyHistory(userId: string) {
  const events = await listUsageByPassenger(userId);
  return { history: events.map(serializeUsageEvent) };
}

/** End an allowed in-progress session belonging to this passenger. */
export async function endUsage(userId: string, usageId: string) {
  const event = await findUsageById(usageId);
  if (!event || event.passengerId !== userId) {
    throw notFound("Usage session");
  }
  if (event.outcome !== USAGE_OUTCOME.ALLOWED) {
    throw new HttpError(409, "Only allowed sessions can be ended");
  }
  if (event.endedAt) {
    throw new HttpError(409, "Session already ended");
  }

  const updated = await endUsageById(event.id);
  emitActivity(updated);
  await emitReports();
  return { usage: serializeUsageEvent(updated) };
}

/** End open sessions the passenger's current rank may no longer use. */
export async function revokeInaccessibleSessions(
  passengerId: string,
  rank: number,
) {
  const open = await listOpenAllowedUsageByPassenger(passengerId);
  const ended = [];

  for (const event of open) {
    if (canAccess(rank, event.resource.minMembership.rank)) continue;
    const updated = await endUsageById(event.id);
    emitActivity(updated);
    ended.push(updated);
  }

  return ended;
}

/** Return the most recent usage events for crew monitoring. */
export async function listActivity(limit = 40) {
  const events = await listRecentUsage(Math.min(limit, 500));
  return { activity: events.map(serializeUsageEvent) };
}
