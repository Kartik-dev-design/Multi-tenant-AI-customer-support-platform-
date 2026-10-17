import { Schema, model, InferSchemaType } from "mongoose";

export const ROLES = ["owner", "admin", "agent"] as const;
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "agent" },
    refreshTokenHash: { type: String, select: false },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
