import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors.js";
import { hasAllPermissions } from "../rbac/engine.js";

// Route guard. Must run after `authenticate`.
export function authorize(...required: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw AppError.unauthenticated();
    if (!hasAllPermissions(req.user.permissions, required)) throw AppError.forbidden();
    next();
  };
}
