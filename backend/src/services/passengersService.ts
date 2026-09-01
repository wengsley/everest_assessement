/**
 * Passenger create, update, and membership-level changes.
 * @author wengsley
 */

import bcrypt from "bcryptjs";
import { z } from "zod";
import { MEMBERSHIP_KEY, ROLE_KEY } from "../utils/catalog.js";
import { HttpError, notFound } from "../utils/errors.js";
import { findMembershipByKey } from "../models/membership.js";
import { findRoleByKey } from "../models/role.js";
import {
  createUserWithRole,
  findPassengerById,
  findUserByEmail,
  findUserByEmailExcept,
  listUsersByRole,
  updateUser,
} from "../models/user.js";
import { emitReports } from "../utils/realtime.js";
import { serializeUser } from "../utils/serialize.js";
import { revokeInaccessibleSessions } from "./usageService.js";

const levelSchema = z.enum([
  MEMBERSHIP_KEY.SILVER,
  MEMBERSHIP_KEY.GOLD,
  MEMBERSHIP_KEY.PLATINUM,
]);

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  level: levelSchema.default(MEMBERSHIP_KEY.SILVER),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

const levelBodySchema = z.object({
  level: levelSchema,
});

/** List all passengers ordered by name. */
export async function listPassengers() {
  const passengers = await listUsersByRole(ROLE_KEY.PASSENGER, { name: "asc" });
  return { passengers: passengers.map(serializeUser) };
}

/** Create a passenger with a role, membership, and hashed password. */
export async function createPassenger(input: unknown) {
  const body = createSchema.parse(input);
  const existing = await findUserByEmail(body.email.toLowerCase());
  if (existing) {
    throw new HttpError(409, "Email already in use");
  }

  const [role, membership] = await Promise.all([
    findRoleByKey(ROLE_KEY.PASSENGER),
    findMembershipByKey(body.level),
  ]);

  const user = await createUserWithRole({
    name: body.name,
    email: body.email.toLowerCase(),
    passwordHash: bcrypt.hashSync(body.password, 10),
    roleId: role.id,
    membershipId: membership.id,
  });

  await emitReports();
  return { user: serializeUser(user) };
}

/** Update a passenger's name or email, rejecting email clashes. */
export async function updatePassenger(id: string, input: unknown) {
  const body = updateSchema.parse(input);
  const passenger = await findPassengerById(id);
  if (!passenger) {
    throw notFound("Passenger");
  }

  if (body.email) {
    const clash = await findUserByEmailExcept(
      body.email.toLowerCase(),
      passenger.id,
    );
    if (clash) {
      throw new HttpError(409, "Email already in use");
    }
  }

  const updated = await updateUser(passenger.id, {
    name: body.name ?? passenger.name,
    email: body.email?.toLowerCase() ?? passenger.email,
  });

  return { user: serializeUser(updated) };
}

/** Move a passenger to another membership tier and refresh reports. */
export async function changePassengerLevel(id: string, input: unknown) {
  const { level } = levelBodySchema.parse(input);
  const passenger = await findPassengerById(id);
  if (!passenger) {
    throw notFound("Passenger");
  }

  const membership = await findMembershipByKey(level);
  const updated = await updateUser(passenger.id, {
    membershipId: membership.id,
  });

  await revokeInaccessibleSessions(updated.id, membership.rank);
  await emitReports();
  return { user: serializeUser(updated) };
}
