import { Schema, model } from "mongoose";

const s = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    runId: { type: Schema.Types.ObjectId, ref: "AgentRun" },
  },
  { timestamps: true }
);
s.index({ tenantId: 1, conversationId: 1, createdAt: 1 });

export const Message = model("Message", s);
