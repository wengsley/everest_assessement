/**
 * JWT sign/verify and role gates for crew and passengers.
 * @author wengsley
 */

import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ROLE_KEY } from "../utils/catalog.js";
import { HttpError } from "../utils/errors.js";

export type AuthPayload = {
  userId: string;
  role: string;
  level: string | null;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET ?? "";

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new HttpError(401, "Authentication required"));
    return;
  }

  try {
    const token = header.slice("Bearer ".length);
    req.auth = jwt.verify(token, JWT_SECRET) as AuthPayload;
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired session"));
  }
}

export function requireCrewLead(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (req.auth?.role !== ROLE_KEY.CREW_LEAD) {
    next(new HttpError(403, "Crew Lead access required"));
    return;
  }
  next();
}

export function requirePassenger(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (req.auth?.role !== ROLE_KEY.PASSENGER) {
    next(new HttpError(403, "Passenger access required"));
    return;
  }
  next();
}
