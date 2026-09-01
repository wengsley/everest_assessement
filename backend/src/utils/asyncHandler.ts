/**
 * Forwards rejected async route handlers to Express error middleware.
 * @author wengsley
 */

import { NextFunction, Request, Response } from "express";

type Handler = (req: Request, res: Response) => Promise<void>;

export function asyncHandler(fn: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}
