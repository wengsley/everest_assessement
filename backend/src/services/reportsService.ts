/**
 * Aggregated usage by membership level and resource demand.
 * @author wengsley
 */

import { listMembershipsByRank } from "../models/membership.js";
import { listResourcesWithUsage } from "../models/resource.js";
import { listPassengerMemberships } from "../models/user.js";
import { listUsageWithPassengerMembership } from "../models/usageEvent.js";
import { USAGE_OUTCOME } from "../utils/status.js";

/** Aggregate passenger counts and usage outcomes per membership. */
export async function getByLevel() {
  const [memberships, passengers, events] = await Promise.all([
    listMembershipsByRank(),
    listPassengerMemberships(),
    listUsageWithPassengerMembership(),
  ]);

  return memberships.map((membership) => {
    const cohort = passengers.filter((p) => p.membershipId === membership.id);
    const cohortEvents = events.filter(
      (e) => e.passenger.membershipId === membership.id,
    );
    const allowed = cohortEvents.filter(
      (e) => e.outcome === USAGE_OUTCOME.ALLOWED,
    );
    const uniqueResources = new Set(allowed.map((e) => e.resourceId));

    return {
      level: membership.key,
      passengerCount: cohort.length,
      usageCount: cohortEvents.length,
      allowedCount: allowed.length,
      deniedCount: cohortEvents.length - allowed.length,
      uniqueResourcesUsed: uniqueResources.size,
    };
  });
}

/** Rank resources by allowed uses and flag high-demand stations. */
export async function getAnalytics() {
  const resources = await listResourcesWithUsage();

  const ranked = resources
    .map((resource) => {
      const allowed = resource.usageEvents.filter(
        (e) => e.outcome === USAGE_OUTCOME.ALLOWED,
      );
      const uniquePassengers = new Set(allowed.map((e) => e.passengerId));
      return {
        id: resource.id,
        name: resource.name,
        family: resource.family,
        minLevel: resource.minMembership.key,
        status: resource.status,
        allowedUses: allowed.length,
        deniedUses: resource.usageEvents.length - allowed.length,
        uniquePassengers: uniquePassengers.size,
      };
    })
    .sort((a, b) => b.allowedUses - a.allowedUses)
    .map((row, index) => ({ ...row, demandRank: index + 1 }));

  const peak = ranked[0]?.allowedUses ?? 0;
  const highDemand = ranked.filter(
    (row) => row.allowedUses > 0 && row.allowedUses === peak,
  );

  return { resources: ranked, highDemand };
}

/** Combine by-level totals and analytics for a live socket update. */
export async function getReportSnapshot() {
  const [byLevel, analytics] = await Promise.all([
    getByLevel(),
    getAnalytics(),
  ]);
  return { byLevel, ...analytics };
}
