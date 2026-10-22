import { Schema, model } from "mongoose";

const s = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
    createdVia: { type: String, enum: ["agent", "human"], default: "agent" },
  },
  { timestamps: true }
);
s.index({ tenantId: 1, createdAt: -1 });

export const Ticket = model("Ticket", s);
