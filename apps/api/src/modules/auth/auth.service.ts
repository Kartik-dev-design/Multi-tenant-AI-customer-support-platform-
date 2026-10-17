import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { Tenant } from "../../models/Tenant";
import { User } from "../../models/User";
import { AppError } from "../../utils/AppError";
import { hashToken, signAccess, signRefresh, verifyRefresh } from "../../utils/jwt";

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") +
  "-" + randomBytes(2).toString("hex");

async function issueTokens(user: { id: string; tenantId: unknown; role: string }) {
  const accessToken = signAccess({
    sub: user.id,
    tenantId: String(user.tenantId),
    role: user.role as "owner" | "admin" | "agent",
  });
  const refreshToken = signRefresh(user.id);
  await User.updateOne({ _id: user.id }, { refreshTokenHash: hashToken(refreshToken) });
  return { accessToken, refreshToken };
}

const publicUser = (u: any) => ({
  id: u.id, name: u.name, email: u.email, role: u.role, tenantId: String(u.tenantId),
});

export async function register(input: {
  tenantName: string; name: string; email: string; password: string;
}) {
  if (await User.exists({ email: input.email.toLowerCase() })) {
    throw new AppError(409, "Email already registered");
  }
  const tenant = await Tenant.create({ name: input.tenantName, slug: slugify(input.tenantName) });
  const user = await User.create({
    tenantId: tenant._id,
    name: input.name,
    email: input.email,
    passwordHash: await bcrypt.hash(input.password, 12),
    role: "owner",
  });
  return {
    user: publicUser(user),
    tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    ...(await issueTokens(user)),
  };
}

export async function login(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, "Invalid email or password");
  }
  return { user: publicUser(user), ...(await issueTokens(user)) };
}

export async function refresh(token?: string) {
  if (!token) throw new AppError(401, "Missing refresh token");
  let sub: string;
  try { sub = verifyRefresh(token).sub; } catch { throw new AppError(401, "Invalid refresh token"); }
  const user = await User.findById(sub).select("+refreshTokenHash");
  if (!user || user.refreshTokenHash !== hashToken(token)) {
    // reused or revoked token: kill the session
    if (user) await User.updateOne({ _id: sub }, { $unset: { refreshTokenHash: 1 } });
    throw new AppError(401, "Refresh token revoked");
  }
  return issueTokens(user); // rotation
}

export async function logout(userId: string) {
  await User.updateOne({ _id: userId }, { $unset: { refreshTokenHash: 1 } });
}

export async function me(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "User not found");
  return publicUser(user);
}
