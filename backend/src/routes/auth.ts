/**
 * Auth routes: POST /login and GET /me.
 * @author wengsley
 */

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { login, me } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/login", asyncHandler(login));
authRouter.get("/me", requireAuth, asyncHandler(me));
