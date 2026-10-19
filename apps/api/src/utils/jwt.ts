import jwt, { SignOptions } from "jsonwebtoken";
import { createHash } from "crypto";
import { env } from "../config/env";
import { Role } from "../models/User";

export interface AccessPayload {
  sub: string;
  tenantId: string;
  role: Role;
}
// ye jwt.ts file me humne kuch functions banaye hain jisse hum access aur refresh token ko sign aur verify karenge
export const ACCESS_TTL = "15m";
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const signAccess = (p: AccessPayload) =>
  jwt.sign(p, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TTL } as SignOptions);

export const signRefresh = (sub: string) =>
  jwt.sign({ sub }, env.JWT_REFRESH_SECRET, { expiresIn: "7d" } as SignOptions);

export const verifyAccess = (t: string) => jwt.verify(t, env.JWT_ACCESS_SECRET) as unknown as AccessPayload;
export const verifyRefresh = (t: string) => jwt.verify(t, env.JWT_REFRESH_SECRET) as unknown as { sub: string };

export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
