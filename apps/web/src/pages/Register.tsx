import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { errorMessage } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ tenantName: "", name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center">
      <form className="card" onSubmit={onSubmit}>
        <h1>Create your workspace</h1>
        <p className="muted">Each company gets its own isolated tenant</p>
        {error && <div className="error">{error}</div>}
        <label>Company name
          <input value={form.tenantName} onChange={set("tenantName")} required minLength={2} autoFocus />
        </label>
        <label>Your name
          <input value={form.name} onChange={set("name")} required minLength={2} />
        </label>
        <label>Email
          <input type="email" value={form.email} onChange={set("email")} required />
        </label>
        <label>Password
          <input type="password" value={form.password} onChange={set("password")} required minLength={8} />
        </label>
        <button disabled={busy}>{busy ? "Creating…" : "Create workspace"}</button>
        <p className="muted small">Already have one? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  );
}
