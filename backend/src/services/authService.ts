/**
 * Login, session lookup, and passenger membership checks.
 * @author wengsley
 */

import bcrypt from "bcryptjs";
import { z } from "zod";
import { ROLE_KEY, primaryRoleKey } from "../utils/catalog.js";
import { HttpError } from "../utils/errors.js";
import { signToken } from "../middleware/auth.js";
import {
  findUserByEmailWithAccess,
  findUserByIdWithAccess,
} from "../models/user.js";
import { serializeUser } from "../utils/serialize.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Authenticate an email and password, then issue a session token. */
export async function login(input: unknown) {
  const { email, password } = loginSchema.parse(input);
  const user = await findUserByEmailWithAccess(email.toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    throw new HttpError(401, "Invalid email or password");
  }

  return {
    token: signToken({
      userId: user.id,
      role: primaryRoleKey(user),
      level: user.membership?.key ?? null,
    }),
    user: serializeUser(user),
  };
}

/** Load the signed-in user, or reject an expired session. */
export async function getSessionUser(userId: string) {
  const user = await findUserByIdWithAccess(userId);
  if (!user) {
    throw new HttpError(401, "Session is no longer valid");
  }
  return { user: serializeUser(user) };
}

/** Require a passenger profile and return their membership tier. */
export async function getPassengerMembership(userId: string) {
  const user = await findUserByIdWithAccess(userId);
  if (
    !user ||
    primaryRoleKey(user) !== ROLE_KEY.PASSENGER ||
    !user.membership
  ) {
    throw new HttpError(403, "Passenger profile required");
  }
  return user.membership;
}
