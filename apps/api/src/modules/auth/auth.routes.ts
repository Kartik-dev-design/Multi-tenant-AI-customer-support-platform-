import { Request, Response, Router } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../../config/env";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { REFRESH_TTL_MS } from "../../utils/jwt";
import { loginSchema, registerSchema } from "./auth.schema";
import * as service from "./auth.service";

const COOKIE = "refresh_token";
const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  path: "/api/v1/auth",
  maxAge: REFRESH_TTL_MS,
};

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true });
const router = Router();

function respond(res: Response, status: number, result: any) {
  const { refreshToken, ...body } = result;
  res.cookie(COOKIE, refreshToken, cookieOpts).status(status).json(body);
}

router.post("/register", authLimiter, validate(registerSchema), asyncHandler(async (req, res) => {
  respond(res, 201, await service.register(req.body));
}));

router.post("/login", authLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
  respond(res, 200, await service.login(req.body.email, req.body.password));
}));

router.post("/refresh", asyncHandler(async (req: Request, res: Response) => {
  respond(res, 200, await service.refresh(req.cookies?.[COOKIE]));
}));

router.post("/logout", authenticate, asyncHandler(async (req, res) => {
  await service.logout(req.auth!.userId);
  res.clearCookie(COOKIE, { path: cookieOpts.path }).status(204).end();
}));

router.get("/me", authenticate, asyncHandler(async (req, res) => {
  res.json({ user: await service.me(req.auth!.userId) });
}));

export default router;
