/**
 * HTTP adapters for personal history, ending sessions, and activity.
 * @author wengsley
 */

import { Request, Response } from "express";
import { param } from "../utils/params.js";
import { ok } from "../utils/response.js";
import * as usageService from "../services/usageService.js";

/** GET my history: return this passenger's usage events. */
export async function myHistory(req: Request, res: Response) {
  ok(res, await usageService.getMyHistory(req.auth!.userId));
}

/** POST end usage: close an in-progress allowed session. */
export async function endUsage(req: Request, res: Response) {
  ok(res, await usageService.endUsage(req.auth!.userId, param(req, "id")));
}

/** GET activity: return recent usage events for the crew feed. */
export async function listActivity(req: Request, res: Response) {
  ok(res, await usageService.listActivity(Number(req.query.limit) || 500));
}
