/**
 * Prisma queries for users, crew, and passengers.
 * @author wengsley
 */

import { Prisma } from "@prisma/client";
import { ROLE_KEY } from "../utils/catalog.js";
import { userAccessInclude } from "./includes.js";
import { prisma } from "./prisma.js";

function usersWithRole(key: string): Prisma.UserWhereInput {
  return {
    roleUsers: { some: { role: { key } } },
  };
}

/** Find a user by unique email. */
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

/** Find a user by email, including membership and roles. */
export async function findUserByEmailWithAccess(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: userAccessInclude,
  });
}

/** Find a user by id, including membership and roles. */
export async function findUserByIdWithAccess(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: userAccessInclude,
  });
}

/** List users who hold the given role. */
export async function listUsersByRole(
  roleKey: string,
  orderBy: Prisma.UserOrderByWithRelationInput,
) {
  return prisma.user.findMany({
    where: usersWithRole(roleKey),
    include: userAccessInclude,
    orderBy,
  });
}

/** Count users who hold the given role. */
export async function countUsersByRole(roleKey: string) {
  return prisma.user.count({ where: usersWithRole(roleKey) });
}

/** Create a user and attach a role, optionally with membership. */
export async function createUserWithRole(data: {
  name: string;
  email: string;
  passwordHash: string;
  roleId: string;
  membershipId?: string;
}) {
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      membershipId: data.membershipId,
      roleUsers: { create: { roleId: data.roleId } },
    },
    include: userAccessInclude,
  });
}

/** Find a passenger by id, or null if the user is not a passenger. */
export async function findPassengerById(id: string) {
  return prisma.user.findFirst({
    where: { id, ...usersWithRole(ROLE_KEY.PASSENGER) },
    include: userAccessInclude,
  });
}

/** Find another user already using this email. */
export async function findUserByEmailExcept(email: string, id: string) {
  return prisma.user.findFirst({
    where: { email, NOT: { id } },
  });
}

/** Update a user's name, email, or membership. */
export async function updateUser(
  id: string,
  data: { name?: string; email?: string; membershipId?: string },
) {
  return prisma.user.update({
    where: { id },
    data,
    include: userAccessInclude,
  });
}

/** List passenger ids with their membership ids for reports. */
export async function listPassengerMemberships() {
  return prisma.user.findMany({
    where: usersWithRole(ROLE_KEY.PASSENGER),
    select: { id: true, membershipId: true },
  });
}
