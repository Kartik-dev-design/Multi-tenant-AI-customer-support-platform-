import { Schema, model } from "mongoose";

const s = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "New conversation" },
  },
  { timestamps: true }
);
s.index({ tenantId: 1, updatedAt: -1 });

export const Conversation = model("Conversation", s);
