/**
 * HTTP adapters for passenger roster and membership changes.
 * @author wengsley
 */

import { Request, Response } from "express";
import { param } from "../utils/params.js";
import { created, ok } from "../utils/response.js";
import * as passengersService from "../services/passengersService.js";

/** GET passengers: return the full passenger roster. */
export async function listPassengers(_req: Request, res: Response) {
  ok(res, await passengersService.listPassengers());
}

/** POST passenger: create a settler at the requested membership level. */
export async function createPassenger(req: Request, res: Response) {
  created(res, await passengersService.createPassenger(req.body));
}

/** PATCH passenger: update name and/or email. */
export async function updatePassenger(req: Request, res: Response) {
  ok(res, await passengersService.updatePassenger(param(req, "id"), req.body));
}

/** POST passenger level: change Silver, Gold, or Platinum membership. */
export async function changePassengerLevel(req: Request, res: Response) {
  ok(
    res,
    await passengersService.changePassengerLevel(param(req, "id"), req.body),
  );
}
