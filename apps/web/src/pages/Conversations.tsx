import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { api, errorMessage } from "../api/client";
import { streamChat } from "../api/stream";

interface Convo { id: string; title: string }
interface Tool { id: string; name: string; input: unknown; status: "running" | "done" | "error"; output?: unknown; durationMs?: number }
interface Msg { id: string; role: "user" | "assistant"; content: string; tools?: Tool[] }

const toolLabel: Record<string, string> = {
  searchKnowledgeBase: "Searching knowledge base",
  getOrderStatus: "Looking up order",
  createTicket: "Creating ticket",
};

export default function Conversations() {
  const [convos, setConvos] = useState<Convo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadList = useCallback(async () => {
    const { data } = await api.get("/conversations");
    setConvos(data.conversations);
  }, []);

  useEffect(() => { loadList().catch(() => {}); }, [loadList]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => () => abortRef.current?.abort(), []);

  async function open(id: string) {
    if (streaming) return;
    setActiveId(id);
    setError("");
    const { data } = await api.get(`/conversations/${id}`);
    setMessages(data.messages.map((m: Msg) => ({ id: m.id, role: m.role, content: m.content })));
  }

  function newChat() {
    if (streaming) return;
    setActiveId(null);
    setMessages([]);
    setError("");
  }

  async function seedOrders() {
    try {
      const { data } = await api.post("/demo/seed-orders");
      setNote(`Demo orders loaded: ${data.seeded.join(", ")}`);
    } catch (e) {
      setNote(errorMessage(e));
    }
  }

  // Update the in-progress assistant message (always the last one).
  const patchLast = (fn: (m: Msg) => Msg) =>
    setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? fn(m) : m)));

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setError("");
    setStreaming(true);

    try {
      let convoId = activeId;
      if (!convoId) {
        const { data } = await api.post("/conversations", {});
        convoId = data.conversation.id as string;
        setActiveId(convoId);
      }
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: text },
        { id: crypto.randomUUID(), role: "assistant", content: "", tools: [] },
      ]);

      const ac = new AbortController();
      abortRef.current = ac;
      await streamChat(convoId, text, (ev) => {
        if (ev.type === "text") patchLast((m) => ({ ...m, content: m.content + ev.delta }));
        else if (ev.type === "tool_call")
          patchLast((m) => ({ ...m, tools: [...(m.tools ?? []), { id: ev.id, name: ev.name, input: ev.input, status: "running" }] }));
        else if (ev.type === "tool_result")
          patchLast((m) => ({
            ...m,
            tools: m.tools?.map((t) =>
              t.id === ev.id ? { ...t, status: ev.isError ? "error" : "done", output: ev.output, durationMs: ev.durationMs } : t
            ),
          }));
        else if (ev.type === "error") setError(ev.message);
      }, ac.signal);
      await loadList();
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError((err as Error).message || errorMessage(err));
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="chat-layout">
      <div className="chat-list">
        <button onClick={newChat}>+ New conversation</button>
        <div className="chat-items">
          {convos.map((c) => (
            <div key={c.id} className={`chat-item ${c.id === activeId ? "active" : ""}`} onClick={() => open(c.id)}>
              {c.title}
            </div>
          ))}
          {convos.length === 0 && <p className="muted small">No conversations yet.</p>}
        </div>
        <button className="ghost" onClick={seedOrders}>Load demo orders</button>
        {note && <div className="small muted">{note}</div>}
      </div>

      <div className="chat-main">
        <div className="chat-scroll">
          {messages.length === 0 && (
            <div className="muted empty">
              <p>Try:</p>
              <ul>
                <li>"What's your refund policy?" (needs a doc in the Knowledge base)</li>
                <li>"Where is my order ORD-1001?" (click "Load demo orders" first)</li>
                <li>"I want to talk to a human about a damaged item"</li>
              </ul>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`bubble ${m.role}`}>
              {m.tools?.map((t) => (
                <div key={t.id} className={`tool-chip ${t.status}`} title={JSON.stringify(t.input)}>
                  {t.status === "running" ? "⏳" : t.status === "error" ? "⚠️" : "✓"} {toolLabel[t.name] ?? t.name}
                  {t.durationMs !== undefined && <span className="muted small"> · {t.durationMs}ms</span>}
                </div>
              ))}
              {m.content ? <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                : m.role === "assistant" && streaming && !m.tools?.length && <span className="muted">Thinking…</span>}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        {error && <div className="error">{error}</div>}
        <form className="ask" onSubmit={send}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a customer message…" disabled={streaming} />
          <button disabled={streaming || !input.trim()}>{streaming ? "…" : "Send"}</button>
        </form>
      </div>
    </div>
  );
}
