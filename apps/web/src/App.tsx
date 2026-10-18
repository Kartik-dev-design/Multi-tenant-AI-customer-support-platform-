import { Route, Routes } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
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
          <Route path="conversations" element={<Placeholder title="Conversations" step="Step 3" />} />
          <Route path="knowledge" element={<Placeholder title="Knowledge base" step="Step 2" />} />
          <Route path="approvals" element={<Placeholder title="Approvals" step="Step 4" />} />
          <Route path="agent-runs" element={<Placeholder title="Agent traces" step="Step 3" />} />
        </Route>
      </Route>
    </Routes>
  );
}
