import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/error";
import authRoutes from "./modules/auth/auth.routes";
import agentRunRoutes from "./modules/agent/agentRuns.routes";
import ticketRoutes from "./modules/agent/tickets.routes";
import conversationRoutes from "./modules/conversations/conversations.routes";
import demoRoutes from "./modules/demo/demo.routes";
import knowledgeRoutes from "./modules/knowledge/knowledge.routes";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/api/v1/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/knowledge", knowledgeRoutes);
  app.use("/api/v1/conversations", conversationRoutes);
  app.use("/api/v1/agent-runs", agentRunRoutes);
  app.use("/api/v1/tickets", ticketRoutes);
  app.use("/api/v1/demo", demoRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
