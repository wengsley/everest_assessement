/**
 * HTTP adapters for catalog, provision, decommission, and use.
 * @author wengsley
 */

import { Request, Response } from "express";
import { param } from "../utils/params.js";
import { created, ok } from "../utils/response.js";
import * as resourcesService from "../services/resourcesService.js";

/** GET available resources: return stations this passenger may use. */
export async function listAvailableResources(req: Request, res: Response) {
  ok(res, await resourcesService.listAvailableResources(req.auth!.userId));
}

/** GET resources: return the full catalog for Crew Leads. */
export async function listResources(_req: Request, res: Response) {
  ok(res, await resourcesService.listResources());
}

/** POST resource: provision a new station at a minimum membership. */
export async function createResource(req: Request, res: Response) {
  created(res, await resourcesService.createResource(req.body));
}

/** POST decommission: retire a resource so it can no longer be used. */
export async function decommissionResource(req: Request, res: Response) {
  ok(res, await resourcesService.decommissionResource(param(req, "id")));
}

/** POST use: attempt a passenger resource interaction and record the outcome. */
export async function useResource(req: Request, res: Response) {
  created(
    res,
    await resourcesService.useResource(req.auth!.userId, param(req, "id")),
  );
}
