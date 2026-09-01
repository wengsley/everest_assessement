/**
 * HTTP adapters for login and the current session.
 * @author wengsley
 */

import { Request, Response } from "express";
import { ok } from "../utils/response.js";
import * as authService from "../services/authService.js";

/** POST login: validate credentials and return a JWT plus the public user. */
export async function login(req: Request, res: Response) {
  ok(res, await authService.login(req.body));
}

/** GET current session: return the authenticated user. */
export async function me(req: Request, res: Response) {
  ok(res, await authService.getSessionUser(req.auth!.userId));
}
