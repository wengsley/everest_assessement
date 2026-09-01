/**
 * Crew Lead listing and creation, including the three-lead cap.
 * @author wengsley
 */

import bcrypt from "bcryptjs";
import { z } from "zod";
import { CREW_LEAD_CAP } from "../utils/access.js";
import { ROLE_KEY } from "../utils/catalog.js";
import { HttpError } from "../utils/errors.js";
import { findRoleByKey } from "../models/role.js";
import {
  countUsersByRole,
  createUserWithRole,
  findUserByEmail,
  listUsersByRole,
} from "../models/user.js";
import { serializeUser } from "../utils/serialize.js";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

/** List Crew Leads with the configured headcount cap. */
export async function listCrewLeads() {
  const crew = await listUsersByRole(ROLE_KEY.CREW_LEAD, { createdAt: "asc" });
  return {
    cap: CREW_LEAD_CAP,
    count: crew.length,
    crewLeads: crew.map(serializeUser),
  };
}

/** Create a Crew Lead after enforcing the cap and unique email. */
export async function createCrewLead(input: unknown) {
  const body = createSchema.parse(input);
  const count = await countUsersByRole(ROLE_KEY.CREW_LEAD);
  if (count >= CREW_LEAD_CAP) {
    throw new HttpError(
      409,
      `Crew Lead cap reached (${CREW_LEAD_CAP}). Additional administrators are not permitted.`,
    );
  }

  const existing = await findUserByEmail(body.email.toLowerCase());
  if (existing) {
    throw new HttpError(409, "Email already in use");
  }

  const role = await findRoleByKey(ROLE_KEY.CREW_LEAD);
  const user = await createUserWithRole({
    name: body.name,
    email: body.email.toLowerCase(),
    passwordHash: bcrypt.hashSync(body.password, 10),
    roleId: role.id,
  });

  return { user: serializeUser(user) };
}
