import { Queue } from "bullmq";
import { redisConnection } from "../../config/redis";

export const INGEST_QUEUE = "ingest";
export const MAX_ATTEMPTS = 3;

let queue: Queue | null = null;
const getQueue = () => (queue ??= new Queue(INGEST_QUEUE, { connection: redisConnection }));

export const enqueueIngest = (documentId: string) =>
  getQueue().add(
    "ingest",
    { documentId },
    {
      attempts: MAX_ATTEMPTS,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    }
  );
