/**
 * Crew Lead routes behind Crew Lead authorization.
 * @author wengsley
 */

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createCrewLead,
  listCrewLeads,
} from "../controllers/crewLeadsController.js";
import { requireAuth, requireCrewLead } from "../middleware/auth.js";

export const crewLeadsRouter = Router();

crewLeadsRouter.use(requireAuth, requireCrewLead);
crewLeadsRouter.get("/", asyncHandler(listCrewLeads));
crewLeadsRouter.post("/", asyncHandler(createCrewLead));
