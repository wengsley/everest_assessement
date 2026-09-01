/**
 * Reusable Prisma include fragments for user, resource, and usage queries.
 * @author wengsley
 */

import { Prisma } from "@prisma/client";

export const userAccessInclude = Prisma.validator<Prisma.UserInclude>()({
  membership: true,
  roleUsers: { include: { role: true } },
});

export const resourceAccessInclude = Prisma.validator<Prisma.ResourceInclude>()({
  minMembership: true,
});

export const usageAccessInclude = Prisma.validator<Prisma.UsageEventInclude>()({
  resource: { include: resourceAccessInclude },
  passenger: { include: userAccessInclude },
});
