/**
 * Shapes Prisma records into public API objects.
 * @author wengsley
 */

import { Membership, Resource, Role, RoleUser, UsageEvent, User } from "@prisma/client";
import { primaryRoleKey } from "./catalog.js";

export type UserAccess = User & {
  membership: Membership | null;
  roleUsers: Array<RoleUser & { role: Role }>;
};

export type ResourceAccess = Resource & {
  minMembership: Membership;
};

export type UsageAccess = UsageEvent & {
  resource: ResourceAccess;
  passenger: UserAccess;
};

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  level: string | null;
  createdAt: string;
};

export function serializeUser(user: UserAccess): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: primaryRoleKey(user),
    level: user.membership?.key ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export function serializeResource(resource: ResourceAccess) {
  return {
    id: resource.id,
    name: resource.name,
    family: resource.family,
    minLevel: resource.minMembership.key,
    status: resource.status,
    createdAt: resource.createdAt.toISOString(),
  };
}

export function serializeUsageEvent(event: UsageAccess) {
  return {
    id: event.id,
    outcome: event.outcome,
    startedAt: event.startedAt.toISOString(),
    endedAt: event.endedAt?.toISOString() ?? null,
    resource: serializeResource(event.resource),
    passenger: serializeUser(event.passenger),
  };
}
