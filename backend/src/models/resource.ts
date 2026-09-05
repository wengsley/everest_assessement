/**
 * Prisma queries for ship resources.
 * @author wengsley
 */

import { RESOURCE_STATUS } from "../utils/status.js";
import { resourceAccessInclude } from "./includes.js";
import { prisma } from "./prisma.js";

const resourceOrder = [
  { minMembership: { rank: "asc" as const } },
  { name: "asc" as const },
];

/** List resources that are still in service. */
export async function listActiveResources() {
  return prisma.resource.findMany({
    where: { status: RESOURCE_STATUS.ACTIVE },
    include: resourceAccessInclude,
    orderBy: resourceOrder,
  });
}

/** List every resource, including decommissioned ones. */
export async function listResources() {
  return prisma.resource.findMany({
    include: resourceAccessInclude,
    orderBy: resourceOrder,
  });
}

/** Find one resource by id, including its minimum membership. */
export async function findResourceById(id: string) {
  return prisma.resource.findUnique({
    where: { id },
    include: resourceAccessInclude,
  });
}

/** Insert a new resource row. */
export async function createResource(data: {
  name: string;
  family: string;
  minMembershipId: string;
  status: string;
}) {
  return prisma.resource.create({
    data,
    include: resourceAccessInclude,
  });
}

/** Update a resource's status string. */
export async function updateResourceStatus(id: string, status: string) {
  return prisma.resource.update({
    where: { id },
    data: { status },
    include: resourceAccessInclude,
  });
}
