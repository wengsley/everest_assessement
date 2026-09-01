/**
 * Resource listing, provision, decommission, and permissioned use.
 * @author wengsley
 */

import { z } from "zod";
import { canAccess } from "../utils/access.js";
import { MEMBERSHIP_KEY } from "../utils/catalog.js";
import { HttpError, notFound } from "../utils/errors.js";
import { findMembershipByKey } from "../models/membership.js";
import {
  createResource as insertResource,
  findResourceById,
  listActiveResources,
  listResources as listAllResources,
  updateResourceStatus,
} from "../models/resource.js";
import { createUsageEvent } from "../models/usageEvent.js";
import { emitLiveUsage, emitReports } from "../utils/realtime.js";
import { serializeResource, serializeUsageEvent } from "../utils/serialize.js";
import { RESOURCE_STATUS, USAGE_OUTCOME } from "../utils/status.js";
import { getPassengerMembership } from "./authService.js";

const resourceSchema = z.object({
  name: z.string().min(1),
  family: z.string().min(1),
  minLevel: z.enum([
    MEMBERSHIP_KEY.SILVER,
    MEMBERSHIP_KEY.GOLD,
    MEMBERSHIP_KEY.PLATINUM,
  ]),
});

/** Return active resources the passenger's membership can access. */
export async function listAvailableResources(userId: string) {
  const membership = await getPassengerMembership(userId);
  const resources = await listActiveResources();
  const accessible = resources.filter((resource) =>
    canAccess(membership.rank, resource.minMembership.rank),
  );
  return {
    level: membership.key,
    resources: accessible.map(serializeResource),
  };
}

/** Return every resource in the catalog. */
export async function listResources() {
  const resources = await listAllResources();
  return { resources: resources.map(serializeResource) };
}

/** Provision a resource at the requested minimum membership. */
export async function createResource(input: unknown) {
  const body = resourceSchema.parse(input);
  const minMembership = await findMembershipByKey(body.minLevel);
  const resource = await insertResource({
    name: body.name,
    family: body.family,
    minMembershipId: minMembership.id,
    status: RESOURCE_STATUS.ACTIVE,
  });
  await emitReports();
  return { resource: serializeResource(resource) };
}

/** Retire an active resource so further use is denied. */
export async function decommissionResource(id: string) {
  const resource = await findResourceById(id);
  if (!resource) {
    throw notFound("Resource");
  }
  if (resource.status === RESOURCE_STATUS.DECOMMISSIONED) {
    throw new HttpError(409, "Resource is already decommissioned");
  }

  const updated = await updateResourceStatus(
    resource.id,
    RESOURCE_STATUS.DECOMMISSIONED,
  );
  await emitReports();
  return { resource: serializeResource(updated) };
}

/** Record an allowed or denied use and notify the live crew feed. */
export async function useResource(userId: string, resourceId: string) {
  const membership = await getPassengerMembership(userId);
  const resource = await findResourceById(resourceId);
  if (!resource) {
    throw notFound("Resource");
  }

  const allowed =
    resource.status === RESOURCE_STATUS.ACTIVE &&
    canAccess(membership.rank, resource.minMembership.rank);
  const event = await createUsageEvent({
    passengerId: userId,
    resourceId: resource.id,
    outcome: allowed ? USAGE_OUTCOME.ALLOWED : USAGE_OUTCOME.DENIED,
  });

  await emitLiveUsage(event);

  if (resource.status !== RESOURCE_STATUS.ACTIVE) {
    throw new HttpError(409, "Resource is decommissioned");
  }

  if (!allowed) {
    throw new HttpError(
      403,
      `${resource.name} requires ${resource.minMembership.key} membership`,
    );
  }

  return { usage: serializeUsageEvent(event) };
}
