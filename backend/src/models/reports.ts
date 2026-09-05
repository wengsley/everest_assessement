/**
 * SQL aggregations for crew reports.
 * @author wengsley
 */

import { prisma } from "./prisma.js";

function num(value: unknown) {
  if (typeof value === "bigint") return Number(value);
  return Number(value ?? 0);
}

export type MembershipUsageRow = {
  membershipId: string;
  passengerCount: number;
  usageCount: number;
  allowedCount: number;
  deniedCount: number;
  uniqueResourcesUsed: number;
};

export type ResourceDemandRow = {
  id: string;
  name: string;
  family: string;
  minLevel: string;
  status: string;
  allowedUses: number;
  deniedUses: number;
  uniquePassengers: number;
};

/** Passenger and usage totals grouped by membership, computed in MySQL. */
export async function aggregateUsageByMembership(): Promise<MembershipUsageRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      membershipId: string;
      passengerCount: bigint | number;
      usageCount: bigint | number;
      allowedCount: bigint | number;
      deniedCount: bigint | number;
      uniqueResourcesUsed: bigint | number;
    }>
  >`
    SELECT
      m.id AS membershipId,
      COUNT(DISTINCT CASE WHEN r.key = 'PASSENGER' THEN u.id END) AS passengerCount,
      COUNT(e.id) AS usageCount,
      COALESCE(SUM(e.outcome = 'ALLOWED'), 0) AS allowedCount,
      COALESCE(SUM(e.outcome = 'DENIED'), 0) AS deniedCount,
      COUNT(DISTINCT CASE WHEN e.outcome = 'ALLOWED' THEN e.resourceId END) AS uniqueResourcesUsed
    FROM membership m
    LEFT JOIN user u ON u.membershipId = m.id
    LEFT JOIN role_user ru ON ru.userId = u.id
    LEFT JOIN role r ON r.id = ru.roleId
    LEFT JOIN usage_event e ON e.passengerId = u.id
    GROUP BY m.id
  `;

  return rows.map((row) => ({
    membershipId: row.membershipId,
    passengerCount: num(row.passengerCount),
    usageCount: num(row.usageCount),
    allowedCount: num(row.allowedCount),
    deniedCount: num(row.deniedCount),
    uniqueResourcesUsed: num(row.uniqueResourcesUsed),
  }));
}

/** Resource demand totals grouped in MySQL, without loading usage rows. */
export async function aggregateResourceDemand(): Promise<ResourceDemandRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      family: string;
      minLevel: string;
      status: string;
      allowedUses: bigint | number;
      deniedUses: bigint | number;
      uniquePassengers: bigint | number;
    }>
  >`
    SELECT
      r.id,
      r.name,
      r.family,
      m.key AS minLevel,
      r.status,
      COALESCE(SUM(e.outcome = 'ALLOWED'), 0) AS allowedUses,
      COALESCE(SUM(e.outcome = 'DENIED'), 0) AS deniedUses,
      COUNT(DISTINCT CASE WHEN e.outcome = 'ALLOWED' THEN e.passengerId END) AS uniquePassengers
    FROM resource r
    INNER JOIN membership m ON m.id = r.minMembershipId
    LEFT JOIN usage_event e ON e.resourceId = r.id
    GROUP BY r.id, r.name, r.family, m.key, r.status
  `;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    family: row.family,
    minLevel: row.minLevel,
    status: row.status,
    allowedUses: num(row.allowedUses),
    deniedUses: num(row.deniedUses),
    uniquePassengers: num(row.uniquePassengers),
  }));
}
