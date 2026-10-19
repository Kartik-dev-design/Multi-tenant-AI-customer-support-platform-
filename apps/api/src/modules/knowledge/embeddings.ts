import OpenAI from "openai";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";

let client: OpenAI | null = null;
function getClient() {
  if (!env.OPENAI_API_KEY) throw new AppError(503, "OPENAI_API_KEY is not configured");
  return (client ??= new OpenAI({ apiKey: env.OPENAI_API_KEY }));
}

const BATCH = 96;

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH) {
    const res = await getClient().embeddings.create({
      model: env.EMBEDDING_MODEL,
      input: texts.slice(i, i + BATCH),
      dimensions: env.EMBEDDING_DIMENSIONS,
    });
    out.push(...res.data.map((d) => d.embedding));
  }
  return out;
}
