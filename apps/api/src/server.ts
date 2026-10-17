import { connectDB } from "./config/db";
import { env } from "./config/env";
import { createApp } from "./app";

async function main() {
  await connectDB();
  createApp().listen(env.PORT, () => console.log(`API listening on :${env.PORT}`));
}
main().catch((e) => { console.error(e); process.exit(1); });
