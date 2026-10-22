import { Route, Routes } from "react-router-dom";
import AgentRuns from "./pages/AgentRuns";
import Conversations from "./pages/Conversations";
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Knowledge from "./pages/Knowledge";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Placeholder from "./pages/Placeholder";
import Register from "./pages/Register";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="conversations" element={<Conversations />} />
          <Route path="knowledge" element={<Knowledge />} />
          <Route path="approvals" element={<Placeholder title="Approvals" step="Step 4" />} />
          <Route path="agent-runs" element={<AgentRuns />} />
        </Route>
      </Route>
    </Routes>
  );
}
