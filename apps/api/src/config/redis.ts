import { env } from "./env";

// Plain options object (BullMQ creates its own ioredis connections from it).
const u = new URL(env.REDIS_URL);
export const redisConnection = {
  host: u.hostname,
  port: Number(u.port || 6379),
  password: u.password || undefined,
  maxRetriesPerRequest: null as null,
};
