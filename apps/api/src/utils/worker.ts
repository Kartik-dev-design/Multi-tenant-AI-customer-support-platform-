declare const require: (moduleName: string) => any;
const { Worker } = require("bullmq");
import { connectDB } from "..//config/db";
import { redisConnection } from "../config/redis";
import { KnowledgeDoc } from "../models/KnowledgeDoc";
import { INGEST_QUEUE, MAX_ATTEMPTS } from "../modules/knowledge/ingest.queue";
import { processIngest } from "../modules/knowledge/ingest.processor";
import { ensureVectorIndex } from "../modules/knowledge/vectorIndex";
async function main() {
  await connectDB();
  await ensureVectorIndex();
  const worker = new Worker(INGEST_QUEUE, processIngest, { connection: redisConnection, concurrency: 2 });

  worker.on("completed", (job) => console.log(`ingest done: ${job.data.documentId}`));
  worker.on("failed", async (job, err) => {
    console.error(`ingest failed (attempt ${job?.attemptsMade}):`, err.message);
    // Only surface "failed" to the user once retries are exhausted.
    if (job && job.attemptsMade >= MAX_ATTEMPTS) {
      await KnowledgeDoc.updateOne(
        { _id: job.data.documentId },
        { status: "failed", error: err.message.slice(0, 300) }
      );
    }
  });
  console.log("Ingestion worker running");
}
main().catch((e) => { console.error(e); process.exit(1); });
