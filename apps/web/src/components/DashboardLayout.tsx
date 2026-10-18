import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const nav = [
  { to: "/", label: "Overview", end: true },
  { to: "/conversations", label: "Conversations" },
  { to: "/knowledge", label: "Knowledge base" },
  { to: "/approvals", label: "Approvals" },
  { to: "/agent-runs", label: "Agent traces" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">AI Support</div>
        <nav>
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? "active" : "")}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="user">
          <div>
            <strong>{user?.name}</strong>
            <div className="muted small">{user?.role}</div>
          </div>
          <button className="ghost" onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="content"><Outlet /></main>
    </div>
  );
}
