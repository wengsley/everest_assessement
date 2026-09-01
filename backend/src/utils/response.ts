/**
 * Standard success and failure JSON response helpers.
 * @author wengsley
 */

import { Response } from "express";

export type ApiResponse<T = unknown> = {
  success: boolean;
  status: number;
  message: string;
  data: T;
};

function send<T>(
  res: Response,
  success: boolean,
  status: number,
  message: string,
  data: T,
) {
  const body: ApiResponse<T> = { success, status, message, data };
  res.status(status).json(body);
}

export function ok<T>(res: Response, data: T, message = "success") {
  send(res, true, 200, message, data);
}

export function created<T>(res: Response, data: T, message = "success") {
  send(res, true, 201, message, data);
}

export function fail(
  res: Response,
  status: number,
  message: string,
  data: unknown = [],
) {
  send(res, false, status, message, data);
}
