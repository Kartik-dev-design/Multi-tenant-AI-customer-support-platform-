import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";

let client: Anthropic | null = null;
function getClient() {
  if (!env.ANTHROPIC_API_KEY) throw new AppError(503, "ANTHROPIC_API_KEY is not configured");
  return (client ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }));
}

export async function generate(system: string, user: string, maxTokens = 1000) {
  const res = await getClient().messages.create({
    model: env.LLM_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  return {
    text: res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join(""),
    inputTokens: res.usage.input_tokens,
    outputTokens: res.usage.output_tokens,
  };
}
