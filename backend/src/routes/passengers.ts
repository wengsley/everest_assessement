/**
 * Passenger management routes behind Crew Lead authorization.
 * @author wengsley
 */

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  changePassengerLevel,
  createPassenger,
  listPassengers,
  updatePassenger,
} from "../controllers/passengersController.js";
import { requireAuth, requireCrewLead } from "../middleware/auth.js";

export const passengersRouter = Router();

passengersRouter.use(requireAuth, requireCrewLead);
passengersRouter.get("/", asyncHandler(listPassengers));
passengersRouter.post("/", asyncHandler(createPassenger));
passengersRouter.patch("/:id", asyncHandler(updatePassenger));
passengersRouter.patch("/:id/level", asyncHandler(changePassengerLevel));
