/**
 * Resource catalog and usage routes for crew and passengers.
 * @author wengsley
 */

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createResource,
  decommissionResource,
  listAvailableResources,
  listResources,
  useResource,
} from "../controllers/resourcesController.js";
import {
  requireAuth,
  requireCrewLead,
  requirePassenger,
} from "../middleware/auth.js";

export const resourcesRouter = Router();

resourcesRouter.get(
  "/available",
  requireAuth,
  requirePassenger,
  asyncHandler(listAvailableResources),
);
resourcesRouter.get("/", requireAuth, requireCrewLead, asyncHandler(listResources));
resourcesRouter.post("/", requireAuth, requireCrewLead, asyncHandler(createResource));
resourcesRouter.post(
  "/:id/decommission",
  requireAuth,
  requireCrewLead,
  asyncHandler(decommissionResource),
);
resourcesRouter.post(
  "/:id/use",
  requireAuth,
  requirePassenger,
  asyncHandler(useResource),
);
