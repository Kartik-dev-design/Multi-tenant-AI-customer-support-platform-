import { useAuth } from "../auth/AuthContext";

const stats = [
  { label: "Open conversations", value: "0" },
  { label: "Resolved by AI", value: "0%" },
  { label: "Pending approvals", value: "0" },
  { label: "Docs indexed", value: "0" },
];

export default function Overview() {
  const { user } = useAuth();
  return (
    <>
      <h1>Hi {user?.name} 👋</h1>
      <p className="muted">Your workspace is ready. Next up: upload docs so the AI can answer from them.</p>
      <div className="stats">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <div className="muted small">{s.label}</div>
            <div className="value">{s.value}</div>
          </div>
        ))}
      </div>
    </>
  );
}
