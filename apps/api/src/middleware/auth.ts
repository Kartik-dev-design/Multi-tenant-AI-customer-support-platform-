import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { verifyAccess } from "../utils/jwt";
import { Role } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; tenantId: string; role: Role };
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(new AppError(401, "Missing access token"));
  try {
    const p = verifyAccess(header.slice(7));
    req.auth = { userId: p.sub, tenantId: p.tenantId, role: p.role };
    next();
  } catch {
    next(new AppError(401, "Invalid or expired access token"));
  }
}

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) return next(new AppError(403, "Forbidden"));
    next();
  };
