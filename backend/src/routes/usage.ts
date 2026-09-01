/**
 * Usage history and live activity routes.
 * @author wengsley
 */

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  endUsage,
  listActivity,
  myHistory,
} from "../controllers/usageController.js";
import {
  requireAuth,
  requireCrewLead,
  requirePassenger,
} from "../middleware/auth.js";

export const usageRouter = Router();

usageRouter.get("/me", requireAuth, requirePassenger, asyncHandler(myHistory));
usageRouter.post("/:id/end", requireAuth, requirePassenger, asyncHandler(endUsage));
usageRouter.get(
  "/activity",
  requireAuth,
  requireCrewLead,
  asyncHandler(listActivity),
);
