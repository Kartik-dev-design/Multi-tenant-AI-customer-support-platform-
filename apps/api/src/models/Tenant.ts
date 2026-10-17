import { Schema, model, InferSchemaType } from "mongoose";

const tenantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
  },
  { timestamps: true }
);

export type TenantDoc = InferSchemaType<typeof tenantSchema>;
export const Tenant = model("Tenant", tenantSchema);
