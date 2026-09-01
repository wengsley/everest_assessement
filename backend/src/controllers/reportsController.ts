/**
 * HTTP adapters for usage reports and resource analytics.
 * @author wengsley
 */

import { Request, Response } from "express";
import { ok } from "../utils/response.js";
import * as reportsService from "../services/reportsService.js";

/** GET reports by level: return usage totals grouped by membership. */
export async function reportByLevel(_req: Request, res: Response) {
  ok(res, { byLevel: await reportsService.getByLevel() });
}

/** GET analytics: return per-resource demand and high-demand stations. */
export async function reportAnalytics(_req: Request, res: Response) {
  ok(res, await reportsService.getAnalytics());
}
