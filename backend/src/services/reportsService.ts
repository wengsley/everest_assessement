/**
 * Aggregated usage by membership level and resource demand.
 * @author wengsley
 */

import {
  aggregateResourceDemand,
  aggregateUsageByMembership,
} from "../models/reports.js";
import { listMembershipsByRank } from "../models/membership.js";

/** Aggregate passenger counts and usage outcomes per membership. */
export async function getByLevel() {
  const [memberships, usage] = await Promise.all([
    listMembershipsByRank(),
    aggregateUsageByMembership(),
  ]);
  const byId = new Map(usage.map((row) => [row.membershipId, row]));

  return memberships.map((membership) => {
    const row = byId.get(membership.id);
    return {
      level: membership.key,
      passengerCount: row?.passengerCount ?? 0,
      usageCount: row?.usageCount ?? 0,
      allowedCount: row?.allowedCount ?? 0,
      deniedCount: row?.deniedCount ?? 0,
      uniqueResourcesUsed: row?.uniqueResourcesUsed ?? 0,
    };
  });
}

/** Rank resources by allowed uses and flag high-demand stations. */
export async function getAnalytics() {
  const totals = await aggregateResourceDemand();

  const ranked = totals
    .sort((a, b) => b.allowedUses - a.allowedUses)
    .map((row, index) => ({
      ...row,
      demandRank: index + 1,
    }));

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
