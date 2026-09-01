/**
 * Reads a required Express path parameter or throws 400.
 * @author wengsley
 */

import { Request } from "express";
import { HttpError } from "./errors.js";

export function param(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpError(400, `Missing ${name}`);
  }
  return value;
}
