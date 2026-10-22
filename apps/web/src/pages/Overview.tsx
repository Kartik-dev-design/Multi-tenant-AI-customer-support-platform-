import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

interface Ticket { id: string; subject: string; priority: string; status: string; createdVia: string; createdAt: string }

export default function Overview() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [docs, setDocs] = useState(0);
  const [convos, setConvos] = useState(0);

  useEffect(() => {
    api.get("/tickets").then((r) => setTickets(r.data.tickets)).catch(() => {});
    api.get("/knowledge/documents").then((r) => setDocs(r.data.documents.filter((d: { status: string }) => d.status === "ready").length)).catch(() => {});
    api.get("/conversations").then((r) => setConvos(r.data.conversations.length)).catch(() => {});
  }, []);

  const stats = [
    { label: "Conversations", value: String(convos) },
    { label: "Open tickets", value: String(tickets.filter((t) => t.status === "open").length) },
    { label: "Docs indexed", value: String(docs) },
  ];

  return (
    <>
      <h1>Hi {user?.name} 👋</h1>
      <p className="muted">Here's what's happening in your workspace.</p>
      <div className="stats">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <div className="muted small">{s.label}</div>
            <div className="value">{s.value}</div>
          </div>
        ))}
      </div>

      <section className="panel">
        <h2>Tickets created by the AI</h2>
        {tickets.length === 0 ? <p className="muted">None yet.</p> : (
          <table>
            <thead><tr><th>Subject</th><th>Priority</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td>{t.subject}</td>
                  <td><span className={`badge ${t.priority === "high" ? "failed" : t.priority === "medium" ? "queued" : ""}`}>{t.priority}</span></td>
                  <td className="muted">{t.status}</td>
                  <td className="muted">{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
