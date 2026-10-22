import { getAccessToken, refreshAccessToken } from "./client";

export type ChatEvent =
  | { type: "text"; delta: string }
  | { type: "tool_call"; id: string; name: string; input: unknown }
  | { type: "tool_result"; id: string; name: string; output: unknown; isError: boolean; durationMs: number }
  | { type: "done"; runId: string; messageId?: string }
  | { type: "error"; message: string };

/**
 * POST + SSE. EventSource can't send POST bodies or Authorization headers,
 * so we read the response stream with fetch and parse the SSE frames ourselves.
 */
export async function streamChat(
  conversationId: string,
  content: string,
  onEvent: (e: ChatEvent) => void,
  signal?: AbortSignal
) {
  const request = () =>
    fetch(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      credentials: "include",
      signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAccessToken()}` },
      body: JSON.stringify({ content }),
    });

  let res = await request();
  if (res.status === 401) {
    await refreshAccessToken();
    res = await request();
  }
  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const line = frame.split("\n").find((l) => l.startsWith("data: "));
      if (line) onEvent(JSON.parse(line.slice(6)) as ChatEvent);
    }
  }
}
