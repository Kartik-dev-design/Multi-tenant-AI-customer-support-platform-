import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { env } from "../../config/env";
import { AgentRun } from "../../models/AgentRun";
import { Conversation } from "../../models/Conversation";
import { Message } from "../../models/Message";
import { Tenant } from "../../models/Tenant";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../utils/asyncHandler";
import { runAgent } from "../agent/agent";
import { getAnthropic } from "../knowledge/llm";

const chatLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  keyGenerator: (req) => req.auth?.tenantId ?? "anon",
  validate: { keyGeneratorIpFallback: false },
});

const createSchema = z.object({ title: z.string().trim().max(100).optional() });
const messageSchema = z.object({ content: z.string().trim().min(1).max(4000) });

const router = Router();
router.use(authenticate);

router.get("/", asyncHandler(async (req, res) => {
  const items = await Conversation.find({ tenantId: req.auth!.tenantId }).sort({ updatedAt: -1 }).limit(50);
  res.json({ conversations: items.map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt })) });
}));

router.post("/", validate(createSchema), asyncHandler(async (req, res) => {
  const c = await Conversation.create({
    tenantId: req.auth!.tenantId,
    createdBy: req.auth!.userId,
    ...(req.body.title ? { title: req.body.title } : {}),
  });
  res.status(201).json({ conversation: { id: c.id, title: c.title, updatedAt: c.updatedAt } });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const c = await Conversation.findOne({ _id: req.params.id, tenantId: req.auth!.tenantId });
  if (!c) throw new AppError(404, "Conversation not found");
  const msgs = await Message.find({ conversationId: c._id, tenantId: c.tenantId }).sort({ createdAt: 1 });
  res.json({
    conversation: { id: c.id, title: c.title },
    messages: msgs.map((m) => ({ id: m.id, role: m.role, content: m.content, runId: m.runId, createdAt: m.createdAt })),
  });
}));

// Send a message; the response is a Server-Sent Events stream of agent events.
router.post("/:id/messages", chatLimiter, validate(messageSchema), asyncHandler(async (req, res) => {
  const { tenantId, userId } = req.auth!;
  const convo = await Conversation.findOne({ _id: req.params.id, tenantId });
  if (!convo) throw new AppError(404, "Conversation not found");
  getAnthropic(); // fail fast (503) before opening the stream if the key is missing

  const userText: string = req.body.content;
  const tenant = await Tenant.findById(tenantId);

  // Prior turns for context (text only; tool calls from earlier turns aren't replayed).
  const prior = (await Message.find({ conversationId: convo._id, tenantId }).sort({ createdAt: -1 }).limit(20)).reverse();
  while (prior.length && prior[0].role !== "user") prior.shift(); // Messages API must start with a user turn
  const history = prior.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  await Message.create({ tenantId, conversationId: convo._id, role: "user", content: userText });
  const run = await AgentRun.create({
    tenantId, conversationId: convo._id, userMessage: userText, model: env.LLM_MODEL,
  });

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // tell nginx not to buffer the stream
  });
  const send = (event: unknown) => {
    if (!res.writableEnded && !res.destroyed) res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  // Stop paying for tokens if the browser goes away mid-answer.
  const ac = new AbortController();
  res.on("close", () => { if (!res.writableEnded) ac.abort(); });

  const started = Date.now();
  try {
    const result = await runAgent({
      tenantName: tenant?.name ?? "our company",
      ctx: { tenantId, userId, conversationId: String(convo._id) },
      history,
      userText,
      signal: ac.signal,
      emit: send,
    });

    const saved = result.text
      ? await Message.create({ tenantId, conversationId: convo._id, role: "assistant", content: result.text, runId: run._id })
      : null;
    await AgentRun.updateOne({ _id: run._id }, {
      status: "completed", steps: result.steps, finalText: result.text,
      inputTokens: result.inputTokens, outputTokens: result.outputTokens, latencyMs: Date.now() - started,
    });
    if (convo.title === "New conversation") convo.title = userText.slice(0, 60);
    convo.set("updatedAt", new Date());
    await convo.save();

    send({ type: "done", runId: run.id, messageId: saved?.id });
  } catch (err) {
    const aborted = ac.signal.aborted;
    if (!aborted) console.error("agent run failed:", err);
    await AgentRun.updateOne({ _id: run._id }, {
      status: aborted ? "aborted" : "failed",
      error: aborted ? undefined : (err as Error).message?.slice(0, 500),
      latencyMs: Date.now() - started,
    });
    send({ type: "error", message: aborted ? "Cancelled" : "The assistant ran into a problem. Please try again." });
  } finally {
    res.end();
  }
}));

export default router;
