/**
 * Report and analytics routes for Crew Leads.
 * @author wengsley
 */

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  reportAnalytics,
  reportByLevel,
} from "../controllers/reportsController.js";
import { requireAuth, requireCrewLead } from "../middleware/auth.js";

export const reportsRouter = Router();

reportsRouter.use(requireAuth, requireCrewLead);
reportsRouter.get("/by-level", asyncHandler(reportByLevel));
reportsRouter.get("/analytics", asyncHandler(reportAnalytics));
