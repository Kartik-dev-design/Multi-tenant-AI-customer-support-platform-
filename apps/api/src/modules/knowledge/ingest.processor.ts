import { Job } from "bullmq";
import { Chunk } from "../../models/Chunk";
import { KnowledgeDoc } from "../../models/KnowledgeDoc";
import { chunkText } from "./chunker";
import { embedTexts } from "./embeddings";
import { extractText } from "./parser";

export async function processIngest(job: Job<{ documentId: string }>) {
  const doc = await KnowledgeDoc.findById(job.data.documentId);
  if (!doc) return; // deleted while queued

  doc.status = "processing";
  doc.error = undefined;
  await doc.save();

  const text = await extractText(doc.storagePath, doc.mimeType, doc.filename);
  const chunks = chunkText(text);
  if (!chunks.length) throw new Error("No extractable text found in file");

  const vectors = await embedTexts(chunks);

  await Chunk.deleteMany({ documentId: doc._id }); // idempotent on retries
  await Chunk.insertMany(
    chunks.map((t, i) => ({
      tenantId: doc.tenantId,
      documentId: doc._id,
      index: i,
      text: t,
      embedding: vectors[i],
    }))
  );

  doc.status = "ready";
  doc.chunkCount = chunks.length;
  await doc.save();
}
