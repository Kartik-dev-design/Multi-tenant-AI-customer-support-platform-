import { Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { env } from "../../config/env";
import { KnowledgeDoc } from "../../models/KnowledgeDoc";
import { authenticate, requireRole } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../utils/asyncHandler";
import { enqueueIngest } from "./ingest.queue";
import * as service from "./knowledge.service";

const ALLOWED = new Set([".pdf", ".txt", ".md"]);

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const dir = path.join(env.UPLOAD_DIR, req.auth!.tenantId); // per-tenant folder
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => cb(null, randomUUID() + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    ALLOWED.has(path.extname(file.originalname).toLowerCase())
      ? cb(null, true)
      : cb(new AppError(415, "Only .pdf, .txt and .md files are supported")),
});

// Every ask costs money: cap per tenant.
const askLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  keyGenerator: (req) => req.auth?.tenantId ?? "anon",
  validate: { keyGeneratorIpFallback: false },
});

const askSchema = z.object({ question: z.string().trim().min(3).max(1000) });

const router = Router();
router.use(authenticate);

router.get("/documents", asyncHandler(async (req, res) => {
  res.json({ documents: await service.listDocs(req.auth!.tenantId) });
}));

router.post("/documents", requireRole("owner", "admin"), upload.single("file"), asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'No file uploaded (multipart field name must be "file")');
  const doc = await KnowledgeDoc.create({
    tenantId: req.auth!.tenantId,
    uploadedBy: req.auth!.userId,
    filename: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    storagePath: req.file.path,
  });
  try {
    await enqueueIngest(doc.id);
  } catch {
    await KnowledgeDoc.updateOne({ _id: doc._id }, { status: "failed", error: "Could not queue ingestion job" });
    throw new AppError(503, "Ingestion queue unavailable");
  }
  res.status(202).json({ document: service.toDto(doc) });
}));

router.delete("/documents/:id", requireRole("owner", "admin"), asyncHandler(async (req, res) => {
  await service.deleteDoc(req.auth!.tenantId, String(req.params.id));
  res.status(204).end();
}));

router.post("/ask", askLimiter, validate(askSchema), asyncHandler(async (req, res) => {
  res.json(await service.ask(req.auth!.tenantId, req.body.question));
}));

export default router;
