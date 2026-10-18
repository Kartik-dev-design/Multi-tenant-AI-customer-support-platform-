import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The proxy keeps the browser same-origin with the API, so the httpOnly
// refresh cookie works in dev without CORS/SameSite headaches.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:4000" },
  },
});
