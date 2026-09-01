/**
 * Maps HttpError and Zod failures onto the standard JSON envelope.
 * @author wengsley
 */

import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { HttpError } from "../utils/errors.js";
import { fail } from "../utils/response.js";

function isZodError(err: unknown): err is z.ZodError {
  return err instanceof z.ZodError;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof HttpError) {
    fail(res, err.status, err.message);
    return;
  }

  if (isZodError(err)) {
    fail(
      res,
      400,
      "Invalid request",
      err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
    return;
  }

  console.error(err);
  fail(res, 500, "Internal server error");
}
