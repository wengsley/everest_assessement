/**
 * Shared fixtures for integration tests.
 * @author wengsley
 */

import bcrypt from "bcryptjs";
import { prisma } from "../models/prisma.js";
import { createUserWithRole } from "../models/user.js";
import { createResource } from "../models/resource.js";
import { ROLE_KEY, MEMBERSHIP_KEY } from "../utils/catalog.js";
import { RESOURCE_STATUS } from "../utils/status.js";

const passwordHash = bcrypt.hashSync("bridge-7", 10);

export async function resetTransactionalData() {
  await prisma.usageEvent.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.roleUser.deleteMany();
  await prisma.user.deleteMany();
}

export async function ensureCatalog() {
  await prisma.role.upsert({
    where: { key: ROLE_KEY.CREW_LEAD },
    update: { name: "Crew Lead" },
    create: { key: ROLE_KEY.CREW_LEAD, name: "Crew Lead" },
  });
  await prisma.role.upsert({
    where: { key: ROLE_KEY.PASSENGER },
    update: { name: "Passenger" },
    create: { key: ROLE_KEY.PASSENGER, name: "Passenger" },
  });
  await prisma.membership.upsert({
    where: { key: MEMBERSHIP_KEY.SILVER },
    update: { name: "Silver", rank: 0 },
    create: { key: MEMBERSHIP_KEY.SILVER, name: "Silver", rank: 0 },
  });
  await prisma.membership.upsert({
    where: { key: MEMBERSHIP_KEY.GOLD },
    update: { name: "Gold", rank: 1 },
    create: { key: MEMBERSHIP_KEY.GOLD, name: "Gold", rank: 1 },
  });
  await prisma.membership.upsert({
    where: { key: MEMBERSHIP_KEY.PLATINUM },
    update: { name: "Platinum", rank: 2 },
    create: { key: MEMBERSHIP_KEY.PLATINUM, name: "Platinum", rank: 2 },
  });
}

export async function membershipId(key: string) {
  const row = await prisma.membership.findUniqueOrThrow({ where: { key } });
  return row.id;
}

export async function roleId(key: string) {
  const row = await prisma.role.findUniqueOrThrow({ where: { key } });
  return row.id;
}

export async function makePassenger(
  level: string,
  email = `${level.toLowerCase()}.${Date.now()}@mail.com`,
) {
  return createUserWithRole({
    name: `Passenger ${level}`,
    email,
    passwordHash,
    roleId: await roleId(ROLE_KEY.PASSENGER),
    membershipId: await membershipId(level),
  });
}

export async function makeCrew(email = `crew.${Date.now()}@mail.com`) {
  return createUserWithRole({
    name: "Crew Lead",
    email,
    passwordHash,
    roleId: await roleId(ROLE_KEY.CREW_LEAD),
  });
}

export async function makeResource(options: {
  minLevel: string;
  status?: string;
  name?: string;
  family?: string;
}) {
  return createResource({
    name: options.name ?? `${options.minLevel} station ${Date.now()}`,
    family: options.family ?? "Test",
    minMembershipId: await membershipId(options.minLevel),
    status: options.status ?? RESOURCE_STATUS.ACTIVE,
  });
}

export { prisma, passwordHash };
