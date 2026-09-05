/**
 * Crew Lead listing and creation, including the three-lead cap.
 * @author wengsley
 */

import bcrypt from "bcryptjs";
import { z } from "zod";
import { CREW_LEAD_CAP } from "../utils/access.js";
import { ROLE_KEY } from "../utils/catalog.js";
import {
  createCrewLeadIfUnderCap,
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

/** Create a Crew Lead after locking the role row and enforcing the cap. */
export async function createCrewLead(input: unknown) {
  const body = createSchema.parse(input);
  const user = await createCrewLeadIfUnderCap({
    name: body.name,
    email: body.email.toLowerCase(),
    passwordHash: await bcrypt.hash(body.password, 10),
    cap: CREW_LEAD_CAP,
  });
  return { user: serializeUser(user) };
}
