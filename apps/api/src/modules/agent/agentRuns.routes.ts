import { Router } from "express";
import { AgentRun } from "../../models/AgentRun";
import { authenticate } from "../../middleware/auth";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();
router.use(authenticate);

router.get("/", asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = { tenantId: req.auth!.tenantId };
  if (req.query.conversationId) filter.conversationId = String(req.query.conversationId);
  const runs = await AgentRun.find(filter).sort({ createdAt: -1 }).limit(50);
  res.json({
    runs: runs.map((r) => ({
      id: r.id,
      conversationId: r.conversationId,
      userMessage: r.userMessage,
      status: r.status,
      toolsUsed: (r.steps as any[]).filter((s) => s.type === "tool").map((s) => s.name),
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      latencyMs: r.latencyMs,
      createdAt: r.createdAt,
    })),
  });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const r = await AgentRun.findOne({ _id: req.params.id, tenantId: req.auth!.tenantId });
  if (!r) throw new AppError(404, "Run not found");
  res.json({ run: r });
}));

export default router;
