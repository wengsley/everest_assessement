/**
 * Prisma lookup for configured roles.
 * @author wengsley
 */

import { HttpError } from "../utils/errors.js";
import { prisma } from "./prisma.js";

/** Load a role by key, or fail if it is missing from configuration. */
export async function findRoleByKey(key: string) {
  const role = await prisma.role.findUnique({ where: { key } });
  if (!role) {
    throw new HttpError(500, `Role ${key} is not configured`);
  }
  return role;
}
