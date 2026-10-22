import { useEffect, useState } from "react";
import { api } from "../api/client";

interface RunSummary {
  id: string; userMessage: string; status: string; toolsUsed: string[];
  inputTokens: number; outputTokens: number; latencyMs?: number; createdAt: string;
}
interface Step {
  type: "llm" | "tool"; iteration?: number; stopReason?: string; inputTokens?: number; outputTokens?: number;
  name?: string; input?: unknown; output?: unknown; isError?: boolean; durationMs: number;
}
interface RunDetail extends RunSummary { steps: Step[]; finalText?: string; error?: string; model: string }

export default function AgentRuns() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [detail, setDetail] = useState<RunDetail | null>(null);

  useEffect(() => { api.get("/agent-runs").then((r) => setRuns(r.data.runs)).catch(() => {}); }, []);
  const open = async (id: string) => setDetail((await api.get(`/agent-runs/${id}`)).data.run);

  return (
    <>
      <h1>Agent traces</h1>
      <p className="muted">Every agent turn: each model call and tool call, with inputs, outputs, tokens and latency.</p>
      <div className="trace-layout">
        <section className="panel">
          {runs.length === 0 && <p className="muted">No runs yet. Chat in Conversations first.</p>}
          {runs.map((r) => (
            <div key={r.id} className={`run-row ${detail?.id === r.id ? "active" : ""}`} onClick={() => open(r.id)}>
              <div className="run-msg">{r.userMessage}</div>
              <div className="small muted">
                <span className={`badge ${r.status === "completed" ? "ready" : r.status === "failed" ? "failed" : "queued"}`}>{r.status}</span>{" "}
                {r.toolsUsed.length ? r.toolsUsed.join(" → ") : "no tools"} · {r.inputTokens + r.outputTokens} tok · {r.latencyMs ?? "–"}ms
              </div>
            </div>
          ))}
        </section>

        <section className="panel">
          {!detail ? <p className="muted">Select a run to inspect it.</p> : (
            <>
              <div className="small muted">{detail.model} · {detail.inputTokens} in / {detail.outputTokens} out tokens</div>
              <div><strong>User:</strong> {detail.userMessage}</div>
              {detail.steps.map((s, i) => (
                <div key={i} className={`step ${s.type}`}>
                  {s.type === "llm" ? (
                    <div className="small">
                      <strong>Model call {s.iteration}</strong> <span className="muted">
                      · stop: {s.stopReason} · {s.inputTokens}/{s.outputTokens} tok · {s.durationMs}ms</span>
                    </div>
                  ) : (
                    <>
                      <div className="small"><strong>Tool: {s.name}</strong> <span className="muted">· {s.durationMs}ms{s.isError ? " · ERROR" : ""}</span></div>
                      <pre>{JSON.stringify(s.input, null, 2)}</pre>
                      <pre>{JSON.stringify(s.output, null, 2)}</pre>
                    </>
                  )}
                </div>
              ))}
              {detail.finalText && <div><strong>Answer:</strong><div style={{ whiteSpace: "pre-wrap" }}>{detail.finalText}</div></div>}
              {detail.error && <div className="error">{detail.error}</div>}
            </>
          )}
        </section>
      </div>
    </>
  );
}
