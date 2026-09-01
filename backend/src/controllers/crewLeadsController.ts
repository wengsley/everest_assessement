/**
 * HTTP adapters for listing and creating Crew Leads.
 * @author wengsley
 */

import { Request, Response } from "express";
import { created, ok } from "../utils/response.js";
import * as crewLeadsService from "../services/crewLeadsService.js";

/** GET Crew Leads: return the roster and remaining cap. */
export async function listCrewLeads(_req: Request, res: Response) {
  ok(res, await crewLeadsService.listCrewLeads());
}

/** POST Crew Lead: create a new administrator if the cap allows. */
export async function createCrewLead(req: Request, res: Response) {
  created(res, await crewLeadsService.createCrewLead(req.body));
}
