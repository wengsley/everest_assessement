/**
 * Prisma lookups for membership tiers.
 * @author wengsley
 */

import { HttpError } from "../utils/errors.js";
import { prisma } from "./prisma.js";

/** Load a membership tier by key, or fail if it is missing. */
export async function findMembershipByKey(key: string) {
  const membership = await prisma.membership.findUnique({ where: { key } });
  if (!membership) {
    throw new HttpError(500, `Membership ${key} is not configured`);
  }
  return membership;
}

/** List membership tiers from lowest rank to highest. */
export async function listMembershipsByRank() {
  return prisma.membership.findMany({ orderBy: { rank: "asc" } });
}
