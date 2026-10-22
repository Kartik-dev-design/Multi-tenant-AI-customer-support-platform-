import { Schema, model } from "mongoose";

// One run = one agent turn (user message -> final answer), including every LLM call and tool call.
const s = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, required: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    userMessage: { type: String, required: true },
    status: { type: String, enum: ["running", "completed", "failed", "aborted"], default: "running" },
    model: { type: String, required: true },
    steps: { type: [Schema.Types.Mixed], default: [] },
    finalText: { type: String },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    latencyMs: { type: Number },
    error: { type: String },
  },
  { timestamps: true }
);
s.index({ tenantId: 1, createdAt: -1 });

export const AgentRun = model("AgentRun", s);
